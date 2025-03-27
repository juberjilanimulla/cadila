import { Router } from "express";
import {
  successResponse,
  errorResponse,
} from "../../helpers/serverResponse.js";
import jobpostingmodel from "../../model/jobpostingmodel.js";
import jobapplicantsmodel from "../../model/jobapplicantsmodel.js";

const jobpostingrecruiterRouter = Router();

jobpostingrecruiterRouter.post("/create", createjobpostingHandler);
jobpostingrecruiterRouter.post("/update", updatejobpostingHandler);
jobpostingrecruiterRouter.post("/getall", getalljobpostingHandler);
jobpostingrecruiterRouter.get("/viewjobform", getjobapplicationsHandler);

export default jobpostingrecruiterRouter;

async function createjobpostingHandler(req, res) {
  try {
    const role = res.locals && res.locals.role;
    const recruiterid = res.locals.id;
    if (role !== "recruiter") {
      return errorResponse(res, 403, "Unauthorized access - recruiter only");
    }

    const { jobtitle, experience, salary, location, jobdescription } = req.body;
    if (!jobtitle || !experience || !salary || !location || !jobdescription) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = {
      jobtitle,
      experience,
      salary,
      location,
      jobdescription,
      postedBy: recruiterid,
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

async function updatejobpostingHandler(req, res) {
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
    // Add logic to mark the job posting as unapproved after update
    updatedData.approved = false;

    const updated = await jobpostingmodel.findByIdAndUpdate(
      _id,
      updatedData,
      options
    );

    if (!updated) {
      return errorResponse(res, 404, "Job posting not found");
    }

    successResponse(
      res,
      "Job posting updated successfully. Awaiting admin/manager approval.",
      updated
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getalljobpostingHandler(req, res) {
  try {
    const { pageno = 0, filterBy = {}, sortby = {}, search = "" } = req.body;

    const limit = 10;
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

async function getjobapplicationsHandler(req, res) {
  try {
    const recruiterid = res.locals.id;
    const role = res.locals.role;

    if (role !== "recruiter") {
      return errorResponse(res, 403, "Unauthorized access - recruiters only");
    }

    const { jobid } = req.query; // Optional filtering by job ID

    let query = { recruiterid };

    if (jobid) {
      query.jobid = jobid; // If jobid is provided, filter by it
    }

    const applications = await jobapplicantsmodel
      .find(query)
      .populate("jobid", "jobtitle location") // Populate job details
      .populate("applicantid", "firstname lastname email") // Populate applicant details
      .select("-__v");

    const transformedApplications = applications.map((application) => {
      const { jobid, ...rest } = application.toObject();
      return {
        ...rest,
        jobtitle: jobid?.jobtitle,
        location: jobid?.location,
      };
    });
    successResponse(
      res,
      "Applications retrieved successfully",
      transformedApplications
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "Internal server error");
  }
}
