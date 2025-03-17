import { Router } from "express";
import jobpostingmodel from "../../model/jobpostingmodel.js";
import {
  successResponse,
  errorResponse,
} from "../../helpers/serverResponse.js";
import mongoose from "mongoose";

const managerjobpostingRouter = Router();

managerjobpostingRouter.post("/create", createjobpostHandler);
managerjobpostingRouter.post("/getall", getalljobpostHandler);
managerjobpostingRouter.post("/update", updatejobpostHandler);
managerjobpostingRouter.post("/delete", deletejobpostHandler);
managerjobpostingRouter.post("/approved/:id", approvedjobpostingHandler);

export default managerjobpostingRouter;

async function createjobpostHandler(req, res) {
  try {
    const role = res.locals && res.locals.role;
    const managerid = res.locals.id;
    if (role !== "manager") {
      return errorResponse(res, 403, "Unauthorized access - manager only");
    }

    const { postedBy, jobtitle, experience, salary, location, jobdescription } =
      req.body;
    if (!jobtitle || !experience || !salary || !location || !jobdescription) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = {
      postedBy: managerid,
      jobtitle,
      experience,
      salary,
      location,
      jobdescription,
    };
    const jobposting = await jobpostingmodel.create(params);
    if (!jobposting) {
      return errorResponse(res, 404, "career job add not properly");
    }
    successResponse(res, "success", jobposting);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getalljobpostHandler(req, res) {
  try {
    const { pageno = 0, filterBy = {}, sortby = {}, search = "" } = req.body;

    const limit = 20;
    const skip = pageno * limit;

    let query = { postedBy: res.locals.id };

    // Apply filters
    if (filterBy && Object.keys(filterBy).length > 0) {
      Object.keys(filterBy).forEach((key) => {
        if (filterBy[key] !== undefined) {
          query[key] = filterBy[key];
        }
      });
    }

    // Apply search
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const searchFields = ["jobtitle", "salary", "location"];
      const searchConditions = searchFields.map((field) => ({
        [field]: { $regex: searchRegex },
      }));
      // Ensure existing conditions (filters & search) are combined correctly
      query.$or = searchConditions;
    }
    // Apply sorting
    const sortBy =
      Object.keys(sortby).length !== 0
        ? Object.keys(sortby).reduce((acc, key) => {
            acc[key] = sortby[key] === "asc" ? 1 : -1; // Assuming sortby values are 'asc' or 'desc'
            return acc;
          }, {})
        : { createdAt: -1 };

    const totalCount = await jobpostingmodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const jobposting = await jobpostingmodel
      .find(query)
      .select(" -__v ")
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    successResponse(res, "Success", { jobposting, totalPages });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updatejobpostHandler(req, res) {
  try {
    const { _id, ...updatedData } = req.body;
    const options = { new: true };
    if (
      !updatedData.jobtitle ||
      !updatedData.experience ||
      !updatedData.salary ||
      !updatedData.location ||
      !updatedData.jobdescription
    ) {
      errorResponse(res, 404, "Some params are missing");
      return;
    }
    const updated = await jobpostingmodel.findByIdAndUpdate(
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

async function deletejobpostHandler(req, res) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "some params are missing");
    }
    const jobposting = await jobpostingmodel.findByIdAndDelete({ _id: _id });
    if (!jobposting) {
      return errorResponse(res, 404, "jobposting id not found");
    }
    successResponse(res, "Success");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function approvedjobpostingHandler(req, res) {
  try {
    const jobpostingid = req.params.id;
    const { approved } = req.body;

    if (typeof approved !== "boolean") {
      return errorResponse(res, 400, "Invalid approved status");
    }

    const updatedUser = await jobpostingmodel.findByIdAndUpdate(
      jobpostingid,
      { approved },
      { new: true }
    );

    if (!updatedUser) {
      return errorResponse(res, 404, "User not found");
    }

    successResponse(
      res,
      "job post  approval status updated successfully",
      updatedUser
    );
  } catch (error) {
    console.log("Error:", error.message);
    return errorResponse(res, 500, "Internal server error");
  }
}
