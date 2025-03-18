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
recruitermanagerRouter.post("/bulk", bulkcreaterecruitersHandler);

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

    const recruiterCount = await usermodel
      .countDocuments({
        role: "recruiter",
      })
      .lean();

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
    const newRecruiter = await usermodel.create({
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
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deleterecruiterHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function resetpasswordHandler(req, res) {
  try {
  } catch (error) {}
}

async function bulkcreaterecruitersHandler(req, res) {
  try {
    const { recruiters } = req.body; // Expecting an array of recruiters

    // Ensure recruiters is an array and limit the count to 99
    if (!Array.isArray(recruiters) || recruiters.length === 0) {
      return errorResponse(
        res,
        400,
        "Invalid input. Provide an array of recruiters."
      );
    }
    if (recruiters.length > 99) {
      return errorResponse(
        res,
        400,
        "Cannot add more than 99 recruiters at a time."
      );
    }

    // Count existing recruiters
    const existingCount = await usermodel.countDocuments({ role: "recruiter" });

    // Check if adding new recruiters exceeds 99
    if (existingCount + recruiters.length > 99) {
      return errorResponse(
        res,
        400,
        `You can only add ${99 - existingCount} more recruiters.`
      );
    }

    // Add the role as "recruiter" to all entries
    const recruiterData = recruiters.map((recruiter) => ({
      ...recruiter,
      role: "recruiter", // Ensuring role is always "recruiter"
    }));

    // Insert recruiters in bulk
    const createdRecruiters = await usermodel.insertMany(recruiterData);

    successResponse(res, "Recruiters created successfully", createdRecruiters);
  } catch (error) {
    console.log("Error:", error);
    errorResponse(res, 500, "Internal server error");
  }
}
