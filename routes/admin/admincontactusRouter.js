import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import contactmodel from "../../model/contactusmodel.js";

const admincontactRouter = Router();

admincontactRouter.get("/", getallcontactusHandler);

export default admincontactRouter;

async function getallcontactusHandler(req, res) {
  try {
    const contactus = await contactmodel.find();
    successResponse(res, "success", contactus);
  } catch (error) {
    console.log("Error", error);
    errorResponse(res, 500, "internal server error");
  }
}
