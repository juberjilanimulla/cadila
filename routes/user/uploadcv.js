import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import {
  successResponse,
  errorResponse,
} from "../../helpers/serverResponse.js";
import { getnumber } from "../../helpers/helperFunction.js";
import fs from "fs";
import jobapplicantsmodel from "../../model/jobapplicantsmodel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function checkPdfFileType(file, cb) {
  const filetypes = /pdf/;
  const extname = filetypes.test(
    path.extname(file.originalname).toLocaleLowerCase()
  );
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Error:PDFs only!"));
  }
}

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../pdfs");
    fs.mkdirSync(uploadPath, { recursive: true }); //ensure directory exists
    cb(null, uploadPath);
  },
  filename: async (req, file, cb) => {
    try {
      const pid = req.params.id;
      const pdfnumber = await getnumber(pid);
      const id = Math.floor(Math.random() * 900000) + 1000;
      const ext = path.extname(file.originalname);
      const filename = `${pdfnumber}__${id}${ext}`;

      cb(null, filename);
    } catch (error) {
      cb(error);
    }
  },
});

const pdfUpload = multer({
  storage: pdfStorage,
  fileFilter: (req, file, cb) => {
    checkPdfFileType(file, cb);
  },
}).single("resume");

const cvpdfRouter = Router();

cvpdfRouter.post("/:id", (req, res) => {
  pdfUpload(req, res, async (err) => {
    if (err) {
      return errorResponse(res, 400, err.message || "upload error");
    }
    if (!req.file) {
      return errorResponse(res, 400, "No File was uploaded");
    }

    try {
      const resume = req.file.filename;
      const contactId = req.params.id;
      const updatedContactcv = await jobapplicantsmodel.findByIdAndUpdate(
        contactId,
        { resume: resume },
        { new: true }
      );
      if (!updatedContactcv) {
        return errorResponse(res, 404, "contact cv not found");
      }
      console.log("updatedContactcv", updatedContactcv);
      successResponse(res, "PDF successfully uploaded cv", updatedContactcv);
    } catch (error) {
      console.log("error", error);
      errorResponse(res, 500, "internal server error");
    }
  });
});

export default cvpdfRouter;
