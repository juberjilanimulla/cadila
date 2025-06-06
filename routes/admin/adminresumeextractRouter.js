import { Router } from "express";
import {
  successResponse,
  errorResponse,
} from "../../helpers/serverResponse.js";
import resumeextractmodel from "../../model/resumeextractmodel.js";
import { google } from "googleapis";
import fs from "fs";
import cvpdfRouter from "./admincvpdfRouter.js";

const credentials = JSON.parse(fs.readFileSync("credentials.json"));
const { client_secret, client_id, redirect_uris } = credentials.installed;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);
oAuth2Client.setCredentials(JSON.parse(fs.readFileSync("token.json")));
const drive = google.drive({ version: "v3", auth: oAuth2Client });
const adminresumeextractRouter = Router();

export default adminresumeextractRouter;

adminresumeextractRouter.post("/", getallresumeextractHandler);
adminresumeextractRouter.use("/upload", cvpdfRouter);
adminresumeextractRouter.delete("/delete", deleteresumeextractHandler);

async function getallresumeextractHandler(req, res) {
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
      const searchFields = ["name", "mobile", "email", "skills", "address"]; // Adjust based on job schema fields
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
    const totalCount = await resumeextractmodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch paginated jobs
    const resumedata = await resumeextractmodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    successResponse(res, "Success", { resumedata, totalPages });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deleteresumeextractHandler(req, res) {
  const { _id } = req.body;

  if (!_id) return errorResponse(res, 400, "Missing resume _id");

  try {
    // Step 1: Try to find the file on Google Drive
    const query = `name='${_id}.pdf' or name='${_id}.docx' or name='${_id}.doc'`;
    const driveSearch = await drive.files.list({
      q: `${query} and trashed=false`,
      fields: "files(id, name)",
    });

    // Step 2: If found, delete the file from Google Drive
    if (driveSearch.data.files.length > 0) {
      const file = driveSearch.data.files[0];
      await drive.files.delete({ fileId: file.id });
    }

    // Step 3: Always attempt to delete from MongoDB
    const deleted = await resumeextractmodel.findByIdAndDelete(_id);

    if (!deleted) {
      return errorResponse(res, 404, "Resume record not found in database");
    }
    successResponse(
      res,
      "Resume deleted from database and (if found) from Google Drive"
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
