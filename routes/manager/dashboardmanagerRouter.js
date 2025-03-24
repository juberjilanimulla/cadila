import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import usermodel from "../../model/usermodel.js";
import talentmodel from "../../model/talentmodel.js";
import contactmodel from "../../model/contactusmodel.js";

const dashboradmanagerRouter = Router();

dashboradmanagerRouter.post("/approved/:id", approvedbymanagerHandler);
dashboradmanagerRouter.post("/getallcontact", getallcontactHandler);
dashboradmanagerRouter.post("/getalltalent", getalltalentHandler);

export default dashboradmanagerRouter;

async function approvedbymanagerHandler(req, res) {
  try {
    const id = res.locals && res.locals.id;

    if (!id) {
      return errorResponse(res, 401, "Unauthorized access - Invalid user");
    }

    const userid = req.params.id;
    const { approved, reject } = req.body;

    if (typeof approved !== "boolean" && typeof reject !== "boolean") {
      return errorResponse(
        res,
        400,
        "Invalid status: approved or reject must be boolean"
      );
    }

    // Determine update fields
    const updateFields = {};
    if (approved === true) {
      updateFields.approved = true;
      updateFields.reject = false;
    } else if (reject === true) {
      updateFields.reject = true;
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
      "recruiter status updated successfully",
      updatedUser
    );
  } catch (error) {
    console.error("Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
}

async function getallcontactHandler(req, res) {
  try {
    const { pageno = 0, filterBy = {}, sortby = {}, search = "" } = req.body;

    const limit = 10;
    const skip = pageno * limit;

    // Base query for contacts
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
      const searchFields = ["firstname", "lastname", "email"];
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
        : { createdAt: -1 }; // Default sorting by most recent

    // Fetch total count for pagination
    const totalCount = await contactmodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch paginated contacts
    const contacts = await contactmodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    successResponse(res, "Success", { contacts, totalPages });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "Internal server error");
  }
}

async function getalltalentHandler(req, res) {
  try {
    const { pageno = 0, filterBy = {}, sortby = {}, search = "" } = req.body;

    const limit = 10;
    const skip = pageno * limit;

    // Base query for talent
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
      const searchFields = ["companyname", "email", "jobrole"];
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
        : { createdAt: -1 }; // Default sorting by most recent

    // Fetch total count for pagination
    const totalCount = await contactmodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch paginated talent
    const talent = await talentmodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    successResponse(res, "Success", { talent, totalPages });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "Internal server error");
  }
}
