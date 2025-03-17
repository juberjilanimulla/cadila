import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import usermodel from "../../model/usermodel.js";


const adminDashboardRouter = Router();

adminDashboardRouter.post("/approve/:id", approveHandler);
adminDashboardRouter.post("/reject/:id", rejectHandler);


export default adminDashboardRouter;

async function approveHandler(req, res) {
  try {
    const id = res.locals && res.locals.id;
    if (!id) {
      return errorResponse(res, 401, "Unauthorized access - Invalid user");
    }

    const userid = req.params.id;
    const { approved } = req.body;

    if (typeof approved !== "boolean") {
      return errorResponse(res, 400, "Invalid approved status");
    }
    // If approved is true, reject should be set to false
    const updateFields = { approved };
    if (approved) {
      updateFields.reject = false;
    }

    const updatedUser = await usermodel
      .findByIdAndUpdate(userid, updateFields, { new: true })
      .select("-tokenotp -password");

    if (!updatedUser) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(
      res,
      "Admin approval status updated successfully",
      updatedUser
    );
  } catch (error) {
    console.error("Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
}

async function rejectHandler(req, res) {
  try {
    const id = res.locals && res.locals.id;

    if (!id) {
      return errorResponse(res, 401, "Unauthorized access - Invalid user");
    }
    const userid = req.params.id;
    const { reject } = req.body;

    if (typeof reject !== "boolean") {
      return errorResponse(res, 400, "Invalid reject status");
    }

    // If reject is true, approved should be false
    const updateFields = { reject };
    if (reject) {
      updateFields.approved = false;
    }

    const updatedUser = await usermodel
      .findByIdAndUpdate(userid, updateFields, { new: true })
      .select("-tokenotp -password");

    if (!updatedUser) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(
      res,
      "User rejection status updated successfully",
      updatedUser
    );
  } catch (error) {
    console.error("Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
}
