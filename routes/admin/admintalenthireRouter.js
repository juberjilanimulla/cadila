import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import talentmodel from "../../model/talentmodel.js";

const admintalenthireRouter = Router();

admintalenthireRouter.get("/", gettalenthireHandler);
admintalenthireRouter.post("/delete", deletetalenthireHandler);

export default admintalenthireRouter;

async function gettalenthireHandler(req, res) {
  try {
    const hiretalent = await talentmodel.find();
    if (!hiretalent) {
      return errorResponse(res, 404, "hire talent not found");
    }
    successResponse(res, "Success", hiretalent);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletetalenthireHandler(req, res) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "some params are missing");
    }
    const contactus = await talentmodel.findByIdAndDelete({ _id: _id });
    if (!contactus) {
      return errorResponse(res, 404, "contactus id not found");
    }
    successResponse(res, "Success");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
