// import { Router } from "express";
// import multer from "multer";
// import { google } from "googleapis";
// import { fileURLToPath } from "url";
// import { dirname } from "path";
// import path from "path";
// import fs from "fs";
// import dotenv from "dotenv";
// import pdfParse from "pdf-parse/lib/pdf-parse.js";
// import mammoth from "mammoth";
// import OpenAI from "openai";
// import {
//   successResponse,
//   errorResponse,
// } from "../../helpers/serverResponse.js";
// import resumeextractmodel from "../../model/resumeextractmodel.js";

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // Multer storage
// const tempStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const tempPath = path.join(__dirname, "../../temp");
//     fs.mkdirSync(tempPath, { recursive: true });
//     cb(null, tempPath);
//   },
//   filename: async (req, file, cb) => {
//     try {
//       const id = Math.floor(Math.random() * 900000) + 1000;
//       const ext = path.extname(file.originalname);
//       cb(null, `${id}${ext}`);
//     } catch (error) {
//       cb(error);
//     }
//   },
// });

// function checkPdfFileType(file, cb) {
//   const ext = path.extname(file.originalname).toLowerCase();
//   const allowedExts = /\.(pdf|doc|docx)$/i;
//   const allowedMimes = [
//     "application/pdf",
//     "application/msword",
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   ];
//   if (allowedExts.test(ext) && allowedMimes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only PDF and Word documents (.doc, .docx) are allowed"));
//   }
// }

// const upload = multer({
//   storage: tempStorage,
//   fileFilter: (req, file, cb) => checkPdfFileType(file, cb),
// }).single("airesume");

// // Google Drive Auth
// const credentials = JSON.parse(fs.readFileSync("credentials.json"));
// const { client_secret, client_id, redirect_uris } = credentials.installed;

// const oAuth2Client = new google.auth.OAuth2(
//   client_id,
//   client_secret,
//   redirect_uris[0]
// );
// oAuth2Client.setCredentials(JSON.parse(fs.readFileSync("token.json")));
// const drive = google.drive({ version: "v3", auth: oAuth2Client });

// // OpenAI setup
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Extract text from PDF or DOCX
// const extractText = async (filePath) => {
//   const ext = path.extname(filePath).toLowerCase();
//   if (ext === ".pdf") {
//     const data = await pdfParse(fs.readFileSync(filePath));
//     return data.text;
//   } else if (ext === ".docx") {
//     const { value } = await mammoth.extractRawText({ path: filePath });
//     return value;
//   } else {
//     throw new Error("Unsupported file type for text extraction");
//   }
// };

// const cvpdfRouter = Router();

// cvpdfRouter.post("/", (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) return errorResponse(res, 400, err.message || "Upload error");

//     if (!req.file) return errorResponse(res, 400, "No file was uploaded");

//     const tempFilePath = req.file.path;
//     const ext = path.extname(tempFilePath).toLowerCase();
//     try {
//       const extractedText = await extractText(tempFilePath);

//       const prompt = `
// You are a resume parsing assistant. From the following extracted text from a document (it may be a resume in PDF or DOC format), extract only the following fields and return them as clean JSON:

// Required Fields:
// - name (Full name)
// - email (Valid email addresses)
// - mobile (All phone numbers found)
// - address (Present or permanent address if found)
// - skills (List of technical, design, and soft skills)
// - education (List of degrees with institution and year range if mentioned)
// - yearofexperience (Total professional experience in years, approximate if exact not stated)
// - experiencesummary (Summarize all job roles and relevant experience in 2-3 lines)

// Make sure:
// - JSON keys are lowercase and exactly as listed.
// - Return a well-formatted JSON object with only the above fields.
// - If a field is missing in the text, return it as an empty string or empty array as appropriate.

// Text:
// """${extractedText}"""
// `;

//       const response = await openai.chat.completions.create({
//         model: "gpt-4",
//         messages: [{ role: "user", content: prompt }],
//         temperature: 0.2,
//       });

//       let parsedData;
//       try {
//         parsedData = JSON.parse(response.choices[0].message.content);
//       } catch (parseErr) {
//         throw new Error("OpenAI response is not valid JSON");
//       }
//       if (Array.isArray(parsedData.education)) {
//         parsedData.education = parsedData.education.map((edu) => {
//           if (typeof edu === "object") {
//             return `${edu.degree || ""}, ${edu.institution || ""}, ${
//               edu.year || ""
//             }`.trim();
//           }
//           return edu;
//         });
//       }
//       if (
//         parsedData.skills &&
//         typeof parsedData.skills === "object" &&
//         !Array.isArray(parsedData.skills)
//       ) {
//         const allSkills = [];
//         Object.values(parsedData.skills).forEach((category) => {
//           if (Array.isArray(category)) {
//             allSkills.push(...category);
//           }
//         });
//         parsedData.skills = allSkills;
//       }
//       // Save to MongoDB to get _id
//       const resumeDoc = new resumeextractmodel(parsedData);
//       await resumeDoc.save();

//       // Rename local file with _id
//       const renamedFileName = `${resumeDoc.id}${ext}`;

//       const renamedFilePath = path.join(
//         path.dirname(tempFilePath),
//         renamedFileName
//       );
//       fs.renameSync(tempFilePath, renamedFilePath);

//       // Ensure folder exists in Drive
//       const folderName = "cadilaresumeextract";
//       const folderQuery = await drive.files.list({
//         q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
//         fields: "files(id)",
//       });

//       let folderId = folderQuery.data.files[0]?.id;
//       if (!folderId) {
//         const folder = await drive.files.create({
//           resource: {
//             name: folderName,
//             mimeType: "application/vnd.google-apps.folder",
//           },
//           fields: "id",
//         });
//         folderId = folder.data.id;
//       }

//       const mimeTypeMap = {
//         ".pdf": "application/pdf",
//         ".doc": "application/msword",
//         ".docx":
//           "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       };

//       const media = {
//         mimeType: mimeTypeMap[ext] || "application/octet-stream",
//         body: fs.createReadStream(renamedFilePath),
//       };
//       try {
//         const uploaded = await drive.files.create({
//           resource: {
//             name: renamedFileName,
//             parents: [folderId],
//           },
//           media,
//           fields: "id, webViewLink",
//         });

//         // console.log("✅ Upload success:", uploaded.data);

//         // Separate try-catch for permission
//         try {
//           resumeDoc.originalFileName = uploaded.data.webViewLink;
//           await resumeDoc.save();

//           fs.unlinkSync(renamedFilePath);

//           return successResponse(
//             res,
//             "Resume uploaded and parsed successfully",
//             resumeDoc
//           );
//         } catch (permErr) {
//           console.error("❌ Permission setting failed:", permErr.message);
//           return errorResponse(
//             res,
//             500,
//             "File uploaded but permission setting failed"
//           );
//         }
//       } catch (driveErr) {
//         console.error("❌ Drive upload failed:", driveErr.message);
//         return errorResponse(res, 500, "Google Drive upload failed");
//       }
//     } catch (error) {
//       console.error("Resume processing error:", error.message);
//       if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
//       errorResponse(res, 500, "Error processing resume");
//     }
//   });
// });

// export default cvpdfRouter;

// import { Router } from "express";
// import multer from "multer";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { dirname } from "path";
// import dotenv from "dotenv";
// import pdfParse from "pdf-parse/lib/pdf-parse.js";
// import mammoth from "mammoth";
// import { google } from "googleapis";
// import resumeextractmodel from "../../model/resumeextractmodel.js";
// import {
//   successResponse,
//   errorResponse,
// } from "../../helpers/serverResponse.js";

// dotenv.config();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // Google Drive
// const credentials = JSON.parse(fs.readFileSync("credentials.json"));
// const { client_secret, client_id, redirect_uris } =
//   credentials.web || credentials.installed;

// const oAuth2Client = new google.auth.OAuth2(
//   client_id,
//   client_secret,
//   redirect_uris[0]
// );
// oAuth2Client.setCredentials(JSON.parse(fs.readFileSync("token.json")));
// const drive = google.drive({ version: "v3", auth: oAuth2Client });

// // Multer
// const tempStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const tempPath = path.join(__dirname, "../../temp");
//     fs.mkdirSync(tempPath, { recursive: true });
//     cb(null, tempPath);
//   },
//   filename: (req, file, cb) => {
//     const id = Math.floor(Math.random() * 900000) + 1000;
//     const ext = path.extname(file.originalname);
//     cb(null, `${id}${ext}`);
//   },
// });

// const upload = multer({
//   storage: tempStorage,
//   fileFilter: (req, file, cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     const allowedExts = /\.(pdf|docx)$/i;
//     const allowedMimes = [
//       "application/pdf",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     ];
//     if (allowedExts.test(ext) && allowedMimes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only PDF or DOCX files are allowed"));
//     }
//   },
// }).single("airesume");

// // Extract Text
// async function extractText(filePath) {
//   const ext = path.extname(filePath).toLowerCase();
//   if (ext === ".pdf") {
//     const data = await pdfParse(fs.readFileSync(filePath));
//     return data.text;
//   } else if (ext === ".docx") {
//     const { value } = await mammoth.extractRawText({ path: filePath });
//     return value;
//   } else {
//     throw new Error("Unsupported file type");
//   }
// }

// function calculateTotalExperience(text) {
//   const ranges = [];
//   const rangePattern =
//     /(?:from\s*)?([A-Za-z]{3,9}[\s\-]?\d{2,4}|\d{1,2}\/\d{2,4})\s*(?:to|-|–|upto|until)\s*(Present|Now|[A-Za-z]{3,9}[\s\-]?\d{2,4}|\d{1,2}\/\d{2,4})/gi;

//   let match;
//   while ((match = rangePattern.exec(text)) !== null) {
//     const fromRaw = match[1];
//     const toRaw = match[2];

//     const from = parseDate(fromRaw);
//     const to = /present|now/i.test(toRaw) ? new Date() : parseDate(toRaw);

//     if (from && to && to > from) {
//       ranges.push({ from, to });
//     }
//   }

//   let totalMonths = 0;
//   for (const { from, to } of ranges) {
//     const months =
//       (to.getFullYear() - from.getFullYear()) * 12 +
//       (to.getMonth() - from.getMonth());
//     totalMonths += months;
//   }

//   const totalYears = (totalMonths / 12).toFixed(1); // rounded to 1 decimal
//   return totalYears;
// }

// function parseDate(str) {
//   str = str.replace(/[-]/g, " ").trim();
//   const tryFormats = [
//     new Date(str), // Mar 2020 or March 2020
//     new Date("01 " + str), // e.g. "04/2019" → "01 04/2019"
//     new Date(str.replace("/", "-")), // 04/2019
//   ];
//   for (const d of tryFormats) {
//     if (!isNaN(d.getTime())) return d;
//   }
//   return null;
// }

// // Parse Data Without OpenAI
// function localParseResume(text) {
//   const lines = text
//     .split("\n")
//     .map((l) => l.trim())
//     .filter(Boolean);
//   const lowerText = text.toLowerCase();

//   const email =
//     text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi)?.[0] || "";
//   const mobile = text.match(/(\+91[\s-]?)?[6-9]\d{9}/g) || [];

//   // Name logic: from first line OR email prefix fallback
//   let name = lines[0];
//   if (!name || name.length > 50 || name.includes("@") || name.match(/\d/)) {
//     name = email ? email.split("@")[0].replace(/[._]/g, " ") : "";
//   }

//   // Address logic: find line with pincode or "Address"
//   const addressLine = lines.find(
//     (line) => line.toLowerCase().includes("address") || line.match(/\b\d{6}\b/)
//   );
//   const address = addressLine || "";

//   // Skills: scan lines after "skills" heading
//   let skills = [];
//   const skillIndex = lines.findIndex((line) =>
//     line.toLowerCase().includes("skills")
//   );
//   if (skillIndex !== -1) {
//     const possibleSkills = lines
//       .slice(skillIndex + 1, skillIndex + 6)
//       .join(" ");
//     skills = possibleSkills.match(/\b([A-Za-z\+#.]{2,})\b/g) || [];
//   }

//   // Education section: collect lines under known degrees
//   const education = [];
//   for (let line of lines) {
//     if (
//       /(b\.?tech|m\.?tech|bsc|msc|mba|diploma|ssc|hsc|intermediate)/i.test(line)
//     ) {
//       education.push(line.trim());
//     }
//   }

//   // Experience summary: look for keywords
//   const expStart = lowerText.indexOf("experience");
//   let experiencesummary = "";
//   if (expStart !== -1) {
//     experiencesummary = text
//       .slice(expStart, expStart + 500)
//       .split("\n")
//       .slice(0, 5)
//       .join(" ");
//   }

//   const yearofexperience = calculateTotalExperience(text);

//   return {
//     name,
//     email,
//     mobile,
//     address,
//     skills: [...new Set(skills)].slice(0, 15),
//     education,
//     experiencesummary: experiencesummary.trim(),
//     yearofexperience,
//   };
// }

// // Main Route
// const cvpdfRouter = Router();

// cvpdfRouter.post("/", (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) return errorResponse(res, 400, err.message || "Upload error");

//     if (!req.file) return errorResponse(res, 400, "No file uploaded");

//     const tempFilePath = req.file.path;
//     const ext = path.extname(tempFilePath).toLowerCase();

//     try {
//       const text = await extractText(tempFilePath);
//       const parsedData = localParseResume(text);

//       const resumeDoc = new resumeextractmodel(parsedData);
//       await resumeDoc.save();

//       const renamedFileName = `${resumeDoc._id}${ext}`;
//       const renamedFilePath = path.join(
//         path.dirname(tempFilePath),
//         renamedFileName
//       );
//       fs.renameSync(tempFilePath, renamedFilePath);

//       const folderName = "cadilaresumeextract";
//       let folderId;
//       const folderQuery = await drive.files.list({
//         q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
//         fields: "files(id)",
//       });

//       folderId = folderQuery.data.files[0]?.id;
//       if (!folderId) {
//         const folder = await drive.files.create({
//           resource: {
//             name: folderName,
//             mimeType: "application/vnd.google-apps.folder",
//           },
//           fields: "id",
//         });
//         folderId = folder.data.id;
//       }

//       const uploaded = await drive.files.create({
//         resource: {
//           name: renamedFileName,
//           parents: [folderId],
//         },
//         media: {
//           mimeType:
//             ext === ".pdf" ? "application/pdf" : "application/octet-stream",
//           body: fs.createReadStream(renamedFilePath),
//         },
//         fields: "id, webViewLink",
//       });

//       resumeDoc.originalFileName = uploaded.data.webViewLink;
//       await resumeDoc.save();
//       fs.unlinkSync(renamedFilePath);

//       return successResponse(
//         res,
//         "Resume uploaded and parsed (local method)",
//         resumeDoc
//       );
//     } catch (error) {
//       console.error("Resume processing error:", error.message);
//       if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
//       return errorResponse(res, 500, "Resume processing failed");
//     }
//   });
// });

// export default cvpdfRouter;
