import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import talentmodel from "../../model/talentmodel.js";

const admintalenthireRouter = Router();

admintalenthireRouter.post("/", gettalenthireHandler);
admintalenthireRouter.post("/delete", deletetalenthireHandler);

export default admintalenthireRouter;

async function gettalenthireHandler(req, res) {
  try {
    const { pageno = 0, filterBy = {}, sortby = {}, search = "" } = req.body;

    const limit = 10; // Number of items per page
    const skip = pageno * limit;

    // Base query for jobs
    let query = {};

    // Apply filters
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
      const searchFields = ["companyname", "jobrole", "email", "mobile"]; // Adjust based on job schema fields
      const searchConditions = searchFields.map((field) => ({
        [field]: { $regex: searchRegex },
      }));

      query = {
        $and: [{ $or: searchConditions }],
      };
    }

    // Apply sorting
    const sortBy =
      Object.keys(sortby).length !== 0
        ? Object.keys(sortby).reduce((acc, key) => {
            acc[key] = sortby[key] === "asc" ? 1 : -1;
            return acc;
          }, {})
        : { createdAt: -1 }; // Default sorting by most recent jobs

    // Fetch total count for pagination
    const totalCount = await talentmodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch paginated jobs
    const talenthire = await talentmodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    successResponse(res, "Success", { talenthire, totalPages });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "Internal server error");
  }
}

async function deletetalenthireHandler(req, res) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "some params are missing");
    }
    const contactus = await talentmodel.findByIdAndDelete({ _id: _id });
    if (!contactus) {
      return errorResponse(res, 404, "contactus id not found");
    }
    successResponse(res, "Success");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
