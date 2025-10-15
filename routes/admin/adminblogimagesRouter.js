import { Router } from "express";
import multer from "multer";
import fs, { createReadStream } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  successResponse,
  errorResponse,
} from "../../helpers/serverResponse.js";
import blogmodel from "../../model/blogmodel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// AWS S3 v3 Setup
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../temp");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(ext);
    if (isImage) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
}).single("blogimage"); // Accept only one image

const adminblogimagesRouter = Router();

adminblogimagesRouter.post("/:id", (req, res) => {
  upload(req, res, async (err) => {
    if (err) return errorResponse(res, 400, err.message || "Upload error");
    if (!req.file) return errorResponse(res, 400, "No file uploaded");

    try {
      const blog = await blogmodel.findById(req.params.id);
      if (!blog) {
        fs.unlinkSync(req.file.path);
        return errorResponse(res, 404, "Blog not found");
      }

      const fileStream = createReadStream(req.file.path);
      const fileName = `${req.params.id}-${Date.now()}${path.extname(
        req.file.originalname
      )}`;
      const s3Key = `blogimages/${fileName}`;

      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: fileStream,
        ContentType: req.file.mimetype,
      });

      await s3.send(uploadCommand);

      const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
      blog.coverimage = imageUrl;

      await blog.save();
      fs.unlinkSync(req.file.path); // Remove local temp file

      return successResponse(res, "Image uploaded successfully", blog);
    } catch (error) {
      console.error("Upload failed:", error.message);
      if (fs.existsSync(req.file?.path)) fs.unlinkSync(req.file.path);
      return errorResponse(res, 500, "Image upload failed");
    }
  });
});

export default adminblogimagesRouter;
