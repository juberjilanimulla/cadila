import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import blogmodel from "../../model/blogmodel.js";

const userblogRouter = Router();
userblogRouter.get("/", getallblogHandler);
export default userblogRouter;

async function getallblogHandler(req, res) {
  try {
    const blog = await blogmodel.find({ published: true });
    successResponse(res, "success", blog);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
