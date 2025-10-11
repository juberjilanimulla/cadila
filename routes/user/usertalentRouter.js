import { Router } from "express";
import talentmodel from "../../model/talentmodel.js";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import { sendMailToAdminforTalent } from "../../helpers/helperFunction.js";

const usertalentRouter = Router();

usertalentRouter.post("/create", createtalentHandler);
export default usertalentRouter;

async function createtalentHandler(req, res) {
  try {
    const {
      companyname,
      email,
      jobrole,
      jobdescription,
      mobile,
      termsaccepted,
    } = req.body;
    if (!companyname || !email || !jobrole || !jobdescription || !mobile) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = {
      companyname,
      email,
      jobrole,
      jobdescription,
      mobile,
      termsaccepted,
    };
    const talent = await talentmodel.create(params);
    await sendMailToAdminforTalent(params);
    successResponse(res, "success", talent);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
