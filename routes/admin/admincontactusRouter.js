import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import contactmodel from "../../model/contactusmodel.js";

const admincontactRouter = Router();

admincontactRouter.get("/", getallcontactusHandler);
admincontactRouter.post("/delete", deletecontactusHandler);

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

async function deletecontactusHandler(req, res) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "some params are missing");
    }
    const contactus = await contactmodel.findByIdAndDelete({ _id: _id });
    if (!contactus) {
      return errorResponse(res, 404, "contactus id not found");
    }
    successResponse(res, "Success");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
