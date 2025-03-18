import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import usermodel from "../../model/usermodel.js";
import { bcryptPassword } from "../../helpers/helperFunction.js";
const recruitermanagerRouter = Router();

recruitermanagerRouter.post("/getall", getallrecruiterHandler);
recruitermanagerRouter.post("/create", createrecruiterHandler);
recruitermanagerRouter.post("/udpate/:id", udpatereruiterHandler);
recruitermanagerRouter.post("/delete/:id", deleterecruiterHandler);
recruitermanagerRouter.post("/resetpassword", resetpasswordHandler);

export default recruitermanagerRouter;

async function getallrecruiterHandler(req, res) {
  try {
    const { pageno = 0, filterBy = {}, sortby = {}, search = "" } = req.body;

    const limit = 10;
    const skip = pageno * limit;

    // Base query to filter recruiters by role (manager or recruiter)
    let query = { role: { $in: ["recruiter"] } };

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
          { role: { $in: ["recruiter"] } }, // Ensure role filter is not lost
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

    // Fetch recruiters
    const recruiters = await usermodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    successResponse(res, "Success", { recruiters, totalPages });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createrecruiterHandler(req, res) {
  try {
    const { firstname, lastname, email, mobile, password } = req.body;
    if (!firstname || !lastname || !email || !mobile || !password) {
      return errorResponse(res, 400, "Some params are missing");
    }

    const existingUser = await usermodel.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 409, "User with this email already exists");
    }

    // Check recruiter count before inserting
    const recruiterCount = await usermodel.countDocuments({
      role: "recruiter",
    });
    if (recruiterCount >= 100) {
      return errorResponse(
        res,
        400,
        "You can manage only up to 100 recruiters."
      );
    }

    // Hash password
    const hashedPassword = bcryptPassword(password);

    // Create recruiter
    const newRecruiter = new usermodel({
      firstname,
      lastname,
      email,
      mobile,
      password: hashedPassword,
      role: "recruiter",
    });

    await newRecruiter.save();
    successResponse(res, "manager create new recruiter", newRecruiter);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function udpatereruiterHandler(req, res) {
  try {
    const { _id, ...updatedData } = req.body;
    const options = { new: true };
    if (
      !updatedData.firstname ||
      !updatedData.lastname ||
      !updatedData.email ||
      !updatedData.mobile
    ) {
      errorResponse(res, 404, "Some params are missing");
      return;
    }
    const updated = await usermodel.findByIdAndUpdate(
      _id,
      updatedData,
      options
    );

    successResponse(res, "success Updated", updated);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deleterecruiterHandler(req, res) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "some params are missing");
    }
    const user = await usermodel.findByIdAndDelete({ _id: _id });
    if (!user) {
      return errorResponse(res, 404, "user id not found");
    }
    successResponse(res, "Success");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function resetpasswordHandler(req, res) {
  try {
    const { email, password } = req.body;
    //  Get the Admin's role from authentication middleware
    const requestingUserRole = res.locals.role;

    const userReset = await usermodel.findOne({ email });

    if (!userReset) {
      errorResponse(res, 400, "email id not found");
      return;
    }
    if (requestingUserRole !== "manager") {
      return errorResponse(
        res,
        403,
        "Access denied. Only manager can reset passwords."
      );
    }

    // 🔹 Admin should not reset their own password
    if (userReset.role === "manager") {
      return errorResponse(
        res,
        403,
        "manager password cannot be reset by another manager."
      );
    }

    userReset.password = bcryptPassword(password);
    await userReset.save({ validateBeforeSave: false });

    return successResponse(res, "Password reset successfully");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error ");
  }
}
