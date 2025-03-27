import { Router } from "express";
import usermodel from "../../model/usermodel.js";
import {
  successResponse,
  errorResponse,
} from "../../helpers/serverResponse.js";
import { bcryptPassword } from "../../helpers/helperFunction.js";
const adminusersRouter = Router();

adminusersRouter.post("/create", admincreateuserHandler);
adminusersRouter.post("/update", adminupdateuserHandler);
adminusersRouter.post("/delete", admindeleteuserHandler);
export default adminusersRouter;

async function admincreateuserHandler(req, res) {
  try {
    const { firstname, lastname, email, mobile, password, role, approved } =
      req.body;

    //  Validate required fields
    if (!firstname || !lastname || !email || !mobile || !password || !role) {
      return errorResponse(res, 400, "Some params are missing");
    }

    //  Prevent Admin role from being created via this route
    if (role === "Admin") {
      return errorResponse(
        res,
        403,
        "Admin account cannot be created through this route"
      );
    }

    //  Check if user already exists
    const existingUser = await usermodel.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 409, "User with this email already exists");
    }

    // Check manager limit (Max 10)
    if (role === "manager") {
      const managerCount = await usermodel.countDocuments({ role: "manager" });
      if (managerCount >= 10) {
        return errorResponse(
          res,
          400,
          "Cannot add more managers. Limit reached (10)."
        );
      }
    }

    //  Check recruiter limit (Max 100)
    if (role === "recruiter") {
      const recruiterCount = await usermodel.countDocuments({
        role: "recruiter",
      });
      if (recruiterCount >= 100) {
        return errorResponse(
          res,
          400,
          "Cannot add more recruiters. Limit reached (100)."
        );
      }
    }

    //  Hash password
    const hashedPassword = bcryptPassword(password);

    //  Create new user
    const newUser = new usermodel({
      firstname,
      lastname,
      email,
      mobile,
      password: hashedPassword,
      role,
      approved: true,
    });

    await newUser.save();

    return successResponse(res, "User successfully created by admin", newUser);
  } catch (error) {
    console.log("Admin Create User Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
}

async function adminupdateuserHandler(req, res) {
  try {
    const { _id, email, mobile, ...updatedData } = req.body;
    const options = { new: true };

    // Check if required fields are present
    if (!updatedData.firstname || !updatedData.lastname || !email || !mobile) {
      return errorResponse(res, 404, "Some params are missing");
    }

    // Check for existing email
    const existingUser = await usermodel.findOne({ email, _id: { $ne: _id } });
    if (existingUser) {
      return errorResponse(res, 409, "User with this email already exists");
    }

    // Check for existing mobile
    const existingMobile = await usermodel.findOne({
      mobile,
      _id: { $ne: _id },
    });
    if (existingMobile) {
      return errorResponse(res, 409, "User with this mobile already exists");
    }

    // Update the user
    const updated = await usermodel.findByIdAndUpdate(
      _id,
      { email, mobile, ...updatedData },
      options
    );

    if (!updated) {
      return errorResponse(res, 404, "User not found");
    }

    successResponse(res, "Successfully updated", updated);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "Internal server error");
  }
}

async function admindeleteuserHandler(req, res) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "some params are missing");
    }
    const contactus = await usermodel.findByIdAndDelete({ _id: _id });
    if (!contactus) {
      return errorResponse(res, 404, "contactus id not found");
    }
    successResponse(res, "Success");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

// const existingUser = await usermodel.findOne({ email });
// if (existingUser) {
//   return errorResponse(res, 409, "User with this email already exists");
// }
// const existingMobile = await usermodel.findOne({ mobile });
// if (existingMobile) {
//   return errorResponse(res, 409, "User with this mobile already exists");
// }
