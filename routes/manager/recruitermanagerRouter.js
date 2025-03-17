import { Router } from "express";
import { errorResponse } from "../../helpers/serverResponse.js";

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
