import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import usermodel from "../../model/usermodel.js";
import { bcryptPassword } from "../../helpers/helperFunction.js";
const adminDashboardRouter = Router();

adminDashboardRouter.post("/approve/:id", approveHandler);
adminDashboardRouter.post("/reject/:id", rejectHandler);
adminDashboardRouter.post("/resetpassword", resetpasswordHandler);
adminDashboardRouter.post("/getallusers", getallusersHandler);

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

//reset password
async function resetpasswordHandler(req, res) {
  try {
    const { email, password } = req.body;
    // 🔹 Get the Admin's role from authentication middleware
    const requestingUserRole = res.locals.role;

    const userReset = await usermodel.findOne({ email });

    if (!userReset) {
      errorResponse(res, 400, "email id not found");
      return;
    }
    if (requestingUserRole !== "Admin") {
      return errorResponse(
        res,
        403,
        "Access denied. Only Admin can reset passwords."
      );
    }

    // 🔹 Admin should not reset their own password
    if (userReset.role === "Admin") {
      return errorResponse(
        res,
        403,
        "Admin password cannot be reset by another Admin."
      );
    }

    userReset.password = bcryptPassword(password);
    await userReset.save({ validateBeforeSave: false });

    return successResponse(res, "Password reset successfully");
  } catch (error) {
    console.log("error", error);
  }
}

async function getallusersHandler(req, res) {
  try {
    const { pageno = 0, filterBy = {}, sortby = {}, search = "" } = req.body;

    const limit = 10;
    const skip = pageno * limit;

    // Base query to filter users by role (manager or recruiter)
    let query = { role: { $in: ["manager", "recruiter"] } };

    // Apply additional filters
    if (filterBy) {
      Object.keys(filterBy).forEach((key) => {
        if (filterBy[key] !== undefined) {
          query[key] = filterBy[key];
        }
      });
    }

    // Apply search
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const searchFields = ["firstname", "lastname", "email"];
      const searchConditions = searchFields.map((field) => ({
        [field]: { $regex: searchRegex },
      }));

      query = {
        $and: [
          { role: { $in: ["manager", "recruiter"] } }, // Ensure role filter is not lost
          { $or: searchConditions }, // Apply search conditions
        ],
      };
    }

    // Apply sorting
    const sortBy =
      Object.keys(sortby).length !== 0
        ? Object.keys(sortby).reduce((acc, key) => {
            acc[key] = sortby[key] === "asc" ? 1 : -1; // Assuming sortby values are 'asc' or 'desc'
            return acc;
          }, {})
        : { createdAt: -1 }; // Default sorting by most recent

    // Fetch total count for pagination
    const totalCount = await usermodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch users
    const users = await usermodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    successResponse(res, "Success", { users, totalPages });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
