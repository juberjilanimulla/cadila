import { Router } from "express";
import talentmodel from "../../model/talentmodel.js";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import { sendMailToTalent } from "../../helpers/helperFunction.js";

const talentRouter = Router();

talentRouter.post("/create", createtalentHandler);
export default talentRouter;

async function createtalentHandler(req, res) {
  try {
    const { companyname, email, jobrole, jobdescription, mobile } = req.body;
    if (!companyname || !email || !jobrole || !jobdescription || !mobile) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = { companyname, email, jobrole, jobdescription, mobile };
    const talent = await talentmodel.create(params);
    await sendMailToTalent(params);
    successResponse(res, "success", talent);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
