// import { Router } from "express";
// import multer from "multer";
// import path from "path";
// import { fileURLToPath } from "url";
// import { dirname } from "path";
// import {
//   successResponse,
//   errorResponse,
// } from "../../helpers/serverResponse.js";
// import { getnumber } from "../../helpers/helperFunction.js";
// import fs from "fs";
// import jobapplicantsmodel from "../../model/jobapplicantsmodel.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// function checkPdfFileType(file, cb) {
//   const filetypes = /pdf/;
//   const extname = filetypes.test(
//     path.extname(file.originalname).toLocaleLowerCase()
//   );
//   const mimetype = filetypes.test(file.mimetype);

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb(new Error("Error:PDFs only!"));
//   }
// }

// const pdfStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, "../../pdfs");
//     fs.mkdirSync(uploadPath, { recursive: true }); //ensure directory exists
//     cb(null, uploadPath);
//   },
//   filename: async (req, file, cb) => {
//     try {
//       const pid = req.params.id;
//       const pdfnumber = await getnumber(pid);
//       const id = Math.floor(Math.random() * 900000) + 1000;
//       const ext = path.extname(file.originalname);
//       const filename = `${pdfnumber}__${id}${ext}`;

//       cb(null, filename);
//     } catch (error) {
//       cb(error);
//     }
//   },
// });

// const pdfUpload = multer({
//   storage: pdfStorage,
//   fileFilter: (req, file, cb) => {
//     checkPdfFileType(file, cb);
//   },
// }).single("resume");

// const cvpdfRouter = Router();

// cvpdfRouter.post("/:id", (req, res) => {
//   pdfUpload(req, res, async (err) => {
//     if (err) {
//       return errorResponse(res, 400, err.message || "upload error");
//     }
//     if (!req.file) {
//       return errorResponse(res, 400, "No File was uploaded");
//     }

//     try {
//       const resume = req.file.filename;
//       const contactId = req.params.id;
//       const updatedContactcv = await jobapplicantsmodel.findByIdAndUpdate(
//         contactId,
//         { resume: resume },
//         { new: true }
//       );
//       if (!updatedContactcv) {
//         return errorResponse(res, 404, "contact cv not found");
//       }
//       console.log("updatedContactcv", updatedContactcv);
//       successResponse(res, "PDF successfully uploaded cv", updatedContactcv);
//     } catch (error) {
//       console.log("error", error);
//       errorResponse(res, 500, "internal server error");
//     }
//   });
// });

// export default cvpdfRouter;

import { Router } from "express";
import multer from "multer";
import { google } from "googleapis";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs";
import {
  successResponse,
  errorResponse,
} from "../../helpers/serverResponse.js";
import { getnumber } from "../../helpers/helperFunction.js";
import jobapplicantsmodel from "../../model/jobapplicantsmodel.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TEMP storage for multer (just during upload)
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempPath = path.join(__dirname, "../../temp");
    fs.mkdirSync(tempPath, { recursive: true });
    cb(null, tempPath);
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

function checkPdfFileType(file, cb) {
  const filetypes = /pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"));
  }
}

const upload = multer({
  storage: tempStorage,
  fileFilter: (req, file, cb) => {
    checkPdfFileType(file, cb);
  },
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
    if (err) {
      return errorResponse(res, 400, err.message || "Upload error");
    }

    if (!req.file) {
      return errorResponse(res, 400, "No file was uploaded");
    }

    const tempFilePath = req.file.path;

    try {
      const fileMeta = {
        name: req.file.filename,
        parents: process.env.GOOGLE_FOLDER_ID
          ? [process.env.GOOGLE_FOLDER_ID]
          : [],
      };

      const media = {
        mimeType: "application/pdf",
        body: fs.createReadStream(tempFilePath),
      };

      const uploaded = await drive.files.create({
        resource: fileMeta,
        media: media,
        fields: "id, webViewLink",
      });

      await drive.permissions.create({
        fileId: uploaded.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      const publicUrl = uploaded.data.webViewLink;

      // ✅ Start from here:
      const applicant = await jobapplicantsmodel.findById(req.params.id);
      console.log("applicant", applicant);
      if (!applicant) {
        fs.unlinkSync(tempFilePath);
        return errorResponse(res, 404, "Applicant not found");
      }

      applicant.resume = publicUrl;
      await applicant.save();

      fs.unlinkSync(tempFilePath);
      successResponse(res, "Resume uploaded to Google Drive", applicant);
    } catch (error) {
      console.log("Upload error:", error);
      errorResponse(res, 500, "Internal server error during upload");
    }
  });
});

export default cvpdfRouter;
