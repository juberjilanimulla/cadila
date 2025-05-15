import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import termandconditionmodel from "../../model/termsandconditionmodel.js";
const usertermandconditionRouter = Router();

usertermandconditionRouter.get("/", termsandconditionHandler);
export default usertermandconditionRouter;

async function termsandconditionHandler(req, res) {
  try {
    const data = await termandconditionmodel.find().sort({ version: -1 });
    successResponse(res, "success", data);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error ");
  }
}
