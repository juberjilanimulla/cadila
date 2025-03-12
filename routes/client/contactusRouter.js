import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import contactmodel from "../../model/contactusmodel.js";

const contactusRouter = Router();

contactusRouter.post("/create", createcontactusHandler);

export default contactusRouter;

async function createcontactusHandler(req, res) {
  try {
    const { firstname, lastname, email, mobile, message } = req.body;
    if (!firstname || !lastname || !email || !mobile || !message) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = { firstname, lastname, email, mobile, message };
    const contactus = await contactmodel.create(params);
    successResponse(res, "success", contactus);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
