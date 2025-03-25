import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";

import cvpdfRouter from "./uploadcv.js";
import jobapplicantsmodel from "../../model/jobapplicantsmodel.js";
import jobpostingmodel from "../../model/jobpostingmodel.js";
import jobmodels from "../../model/jobmodel.js";

const jobapplicantsRouter = Router();

jobapplicantsRouter.post("/create", createjobapplicantHandler);
jobapplicantsRouter.use("/upload", cvpdfRouter);

export default jobapplicantsRouter;

async function createjobapplicantHandler(req, res) {
  try {
    const userid = res.locals.id;
    const { jobid, name, email, mobile, yearofexperience } = req.body;

    if (!jobid || !name || !email || !mobile || !yearofexperience) {
      return errorResponse(res, 400, "Missing required fields");
    }

    const jobpost = await jobpostingmodel.findById(jobid);
    if (!jobpost) {
      return errorResponse(res, 404, "Job post not found");
    }

    const application = await jobapplicantsmodel.create({
      jobid,
      recruiterid: jobpost.postedBy, // Store the recruiter's ID
      applicantid: userid,
      name,
      email,
      mobile,
      yearofexperience,
    });

    successResponse(res, "Application submitted successfully", application);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
