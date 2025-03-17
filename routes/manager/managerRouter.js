import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import usermodel from "../../model/usermodel.js";

const managerRouter = Router();

managerRouter.post("/approved/:id", recruiterapprovedHandler);
managerRouter.post("/reject/:id", rejectrecruiterHandler);
managerRouter.post("/job/create", createjobHandler);

export default managerRouter;

async function recruiterapprovedHandler(req, res) {
  try {
    const id = res.locals && res.locals.id;
    const role = res.locals && res.locals.role;

    if (!id || role !== "manager") {
      return errorResponse(res, 401, "Unauthorized access - Managers only");
    }

    const userid = req.params.id;
    const { approved } = req.body;

    if (typeof approved !== "boolean") {
      return errorResponse(res, 400, "Invalid approved status");
    }

    // Check if the user is a recruiter
    const user = await usermodel.findById(userid);
    if (!user) {
      return errorResponse(res, 404, "Recruiter not found");
    }
    if (user.role !== "recruiter") {
      return errorResponse(res, 403, "Managers can only approve recruiters");
    }

    // If approved is true, reject should be false
    const updateFields = { approved };
    if (approved) {
      updateFields.reject = false;
    }

    const updatedUser = await usermodel
      .findByIdAndUpdate(userid, updateFields, { new: true })
      .select("-tokenotp -password");

    return successResponse(
      res,
      "Recruiter approval status updated successfully",
      updatedUser
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function rejectrecruiterHandler(req, res) {
  try {
    const id = res.locals && res.locals.id;
    const role = res.locals && res.locals.role;

    if (!id || role !== "manager") {
      return errorResponse(res, 401, "Unauthorized access - Managers only");
    }

    const userid = req.params.id;
    const { reject } = req.body;

    if (typeof reject !== "boolean") {
      return errorResponse(res, 400, "Invalid reject status");
    }

    // Check if the user is a recruiter
    const user = await usermodel.findById(userid);
    if (!user) {
      return errorResponse(res, 404, "Recruiter not found");
    }
    if (user.role !== "recruiter") {
      return errorResponse(res, 403, "Managers can only reject recruiters");
    }

    // If reject is true, approved should be false
    const updateFields = { reject };
    if (reject) {
      updateFields.approved = false;
    }

    const updatedUser = await usermodel
      .findByIdAndUpdate(userid, updateFields, { new: true })
      .select("-tokenotp -password");

    return successResponse(
      res,
      "Recruiter rejection status updated successfully",
      updatedUser
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

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
