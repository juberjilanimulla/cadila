import { Router } from "express";
import multer from "multer";
import { google } from "googleapis";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import {
  successResponse,
  errorResponse,
} from "../../helpers/serverResponse.js";
import jobapplicantsmodel from "../../model/jobapplicantsmodel.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Multer temp storage
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempPath = path.join(__dirname, "../../temp");
    fs.mkdirSync(tempPath, { recursive: true });
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    cb(null, "temp" + path.extname(file.originalname)); // temporary name
  },
});

function checkPdfFileType(file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = /\.(pdf|doc|docx)$/i;
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedExts.test(ext) && allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and Word documents (.doc, .docx) are allowed"));
  }
}

const upload = multer({
  storage: tempStorage,
  fileFilter: (req, file, cb) => checkPdfFileType(file, cb),
}).single("resume");

// Google Drive setup
const credentials = JSON.parse(fs.readFileSync("credentials.json"));
const { client_secret, client_id, redirect_uris } = credentials.installed;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);
oAuth2Client.setCredentials(JSON.parse(fs.readFileSync("token.json")));

const drive = google.drive({ version: "v3", auth: oAuth2Client });

const cvpdfRouter = Router();

cvpdfRouter.post("/:id", (req, res) => {
  upload(req, res, async (err) => {
    if (err) return errorResponse(res, 400, err.message || "Upload error");
    if (!req.file) return errorResponse(res, 400, "No file uploaded");

    const tempFilePath = req.file.path;
    const ext = path.extname(tempFilePath).toLowerCase();

    try {
      const applicant = await jobapplicantsmodel.findById(req.params.id);
      if (!applicant) {
        fs.unlinkSync(tempFilePath);
        return errorResponse(res, 404, "Applicant not found");
      }

      const finalFileName = `${applicant._id}${ext}`;
      const renamedPath = path.join(path.dirname(tempFilePath), finalFileName);
      fs.renameSync(tempFilePath, renamedPath);

      // Check for folder or create
      const folderName = "cadilaJobApplicantsResume";
      const folderList = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id)",
      });

      let folderId = folderList.data.files[0]?.id;
      if (!folderId) {
        const folder = await drive.files.create({
          resource: {
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
          },
          fields: "id",
        });
        folderId = folder.data.id;
      }

      // Upload to Google Drive
      const mimeTypeMap = {
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };

      const media = {
        mimeType: mimeTypeMap[ext] || "application/octet-stream",
        body: fs.createReadStream(renamedPath),
      };
      try {
        const uploaded = await drive.files.create({
          resource: {
            name: finalFileName,
            parents: [folderId],
          },
          media,
          fields: "id, webViewLink",
        });

        // console.log("✅ Upload success:", uploaded.data);

        // Separate try-catch for permission
        try {
          applicant.resume = uploaded.data.webViewLink;
          await applicant.save();

          fs.unlinkSync(renamedPath);

          return successResponse(
            res,
            "Resume uploaded and parsed successfully",
            applicant
          );
        } catch (permErr) {
          console.error("❌ Permission setting failed:", permErr.message);
          return errorResponse(
            res,
            500,
            "File uploaded but permission setting failed"
          );
        }
      } catch (driveErr) {
        console.error("❌ Drive upload failed:", driveErr.message);
        return errorResponse(res, 500, "Google Drive upload failed");
      }
    } catch (error) {
      console.error("Resume upload failed:", error.message);
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return errorResponse(res, 500, "Error during resume upload");
    }
  });
});

export default cvpdfRouter;
