import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import privacypolicymodel from "../../model/privacypolicymodel.js";

const adminprivacypolicyRouter = Router();

adminprivacypolicyRouter.get("/", getprivacypolicyHandler);

export default adminprivacypolicyRouter;

async function getprivacypolicyHandler(req, res) {
  try {
    const privacy = await privacypolicymodel.find();
    successResponse(res, "success", privacy);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
