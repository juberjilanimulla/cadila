import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import jobmodels from "../../model/jobmodel.js";
import cvpdfRouter from "./uploadcv.js";

const jobRouter = Router();

jobRouter.post("/create", createjobHandler);
jobRouter.use("/upload", cvpdfRouter);
export default jobRouter;

async function createjobHandler(req, res) {
  try {
    const { jobtitle, name, email, mobile, linkedinlink } = req.body;
    if (!jobtitle || !name || !email || !mobile || !linkedinlink) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = {
      jobtitle,
      name,
      email,
      mobile,
      linkedinlink,
    };
    const careerjob = await jobmodels.create(params);
    if (!careerjob) {
      return errorResponse(res, 404, "career job add not properly");
    }
    successResponse(res, "success", careerjob);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
