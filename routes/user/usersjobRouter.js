import { Router } from "express";

import {
  successResponse,
  errorResponse,
} from "../../helpers/serverResponse.js";
import jobpostingmodel from "../../model/jobpostingmodel.js";
const usersjobRouter = Router();

usersjobRouter.get("/getall", getalljobsHandler);

export default usersjobRouter;

async function getalljobsHandler(req, res) {
  try {
    const jobs = await jobpostingmodel
      .find({ approved: true })
      .sort("-createdAt");
    if (!jobs) {
      return errorResponse(res, 404, "jobs not found");
    }
    successResponse(res, "success", jobs);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
