// import { Router } from "express";
// import {
//   errorResponse,
//   successResponse,
// } from "../../helpers/serverResponse.js";
// import jobapplicantsmodel from "../../model/jobapplicantsmodel.js";

// const adminviewpdfRouter = Router();

// adminviewpdfRouter.get("/:id", getviewpdfHandler);
// export default adminviewpdfRouter;

// async function getviewpdfHandler(req, res) {
//   try {
//     const { id } = req.params;
//     if (!id) {
//       errorResponse(res, 400, "some params are missing");
//     }
//     const jobapp = await jobapplicantsmodel.findById(id);
//     const resumeview = jobapp.resume;

//     successResponse(res, "success", jobapp);
//   } catch (error) {
//     console.log("error", error);
//     errorResponse(res, 500, "internal server error");
//   }
// }

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import jobapplicantsmodel from "../../model/jobapplicantsmodel.js";

const adminviewpdfRouter = Router();

// This enables __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve PDF file
adminviewpdfRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, 400, "Missing ID in request");
    }

    const jobapp = await jobapplicantsmodel.findById(id);
    if (!jobapp || !jobapp.resume) {
      return errorResponse(res, 404, "Resume not found");
    }

    const resumeFile = jobapp.resume;

    // Assume your resume PDFs are stored in /uploads/resumes/
    const resumePath = path.join(__dirname, "../../pdfs", resumeFile);

    if (!fs.existsSync(resumePath)) {
      return errorResponse(res, 404, "Resume file not found on server");
    }
    // Optional: Set headers if you want Postman to display it in-browser
    res.setHeader("Content-Type", "application/pdf");

    return res.sendFile(resumePath);
  } catch (error) {
    console.log("error", error);
    return errorResponse(res, 500, "Internal server error");
  }
});

export default adminviewpdfRouter;
