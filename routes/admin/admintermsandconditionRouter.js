import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import termandconditionmodel from "../../model/termsandconditionmodel.js";
import mongoose from "mongoose";

const admintermsandconditionRouter = Router();

export default admintermsandconditionRouter;
admintermsandconditionRouter.get("/", gettermsandconditionHandler);
admintermsandconditionRouter.post("/create", createtermsandconditionHandler);
admintermsandconditionRouter.put(
  "/update/:id/:sectionid/:itemid",
  updatetermsandconditionHandler
);
admintermsandconditionRouter.delete(
  "/delete/:id",
  deletetermandconditionHandler
);
admintermsandconditionRouter.put(
  "/updatesection/:id/:sectionid",
  updatesectionnameHandler
);
admintermsandconditionRouter.post("/:id/addsection", addsectionHandler);
admintermsandconditionRouter.delete(
  "/:id/deletesection/:sectionid",
  deletesectionHandler
);

admintermsandconditionRouter.post(
  "/:id/additems/:sectionid",
  itemaddsectionHandler
);
admintermsandconditionRouter.delete(
  "/:id/deleteitem/:sectionid/:itemid",
  deleteitemfromsectionHandler
);

async function createtermsandconditionHandler(req, res) {
  try {
    const { termsandconditions } = req.body;

    if (!termsandconditions || !Array.isArray(termsandconditions)) {
      return errorResponse(res, 400, "Invalid or missing termsandconditions");
    }

    const existing = await termandconditionmodel.findOne();
    if (existing) {
      return errorResponse(res, 400, "Terms and Conditions already exist");
    }

    const latest = await termandconditionmodel.findOne().sort({ version: -1 });
    const version = latest ? latest.version + 1 : 1;

    const termandcondition = await termandconditionmodel.create({
      termsandconditions,
      version,
    });

    successResponse(res, "Terms and Conditions created", termandcondition);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updatetermsandconditionHandler(req, res) {
  try {
    const { id, sectionid, itemid } = req.params;
    const { title, value } = req.body;

    if (!title || !value) {
      return errorResponse(res, 400, "Title and value are required");
    }

    const document = await termandconditionmodel.findById(id);
    if (!document) {
      return errorResponse(res, 404, "Document not found");
    }

    const section = document.termsandconditions.find(
      (sec) => sec._id.toString() === sectionid
    );

    if (!section) {
      return errorResponse(res, 404, "Section not found");
    }

    const item = section.items.find((itm) => itm._id.toString() === itemid);

    if (!item) {
      return errorResponse(res, 404, "Item not found");
    }

    // Update values
    item.title = title;
    item.value = value;

    await document.save();
    successResponse(res, "Item updated successfully", document);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function gettermsandconditionHandler(req, res) {
  try {
    const data = await termandconditionmodel.find().sort({ version: -1 });
    successResponse(res, "success", data);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletetermandconditionHandler(req, res) {
  try {
    const { id } = req.params;
    const terms = await termandconditionmodel.findByIdAndDelete(id);
    if (!terms) {
      return errorResponse(res, 404, "Document not found");
    }
    successResponse(res, "success");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updatesectionnameHandler(req, res) {
  try {
    const { id, sectionid } = req.params;
    const { newsection } = req.body;

    if (!newsection) {
      return errorResponse(res, 400, "New section name is required");
    }

    const document = await termandconditionmodel.findById(id);
    if (!document) {
      return errorResponse(res, 404, "Document not found");
    }

    const section = document.termsandconditions.find(
      (sec) => sec._id.toString() === sectionid
    );

    if (!section) {
      return errorResponse(res, 404, "Section not found");
    }

    // Update section name
    section.section = newsection;

    await document.save();
    successResponse(res, "Section name updated successfully", document);
  } catch (error) {
    console.error("Section name update error", error);
    errorResponse(res, 500, "Internal server error");
  }
}

async function addsectionHandler(req, res) {
  try {
    const { id } = req.params;
    const { section, items } = req.body;

    if (!section || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 400, "Section and items are required");
    }

    // Validate and convert _id strings to ObjectId
    const formattedItems = items.map((item) => ({
      _id: new mongoose.Types.ObjectId(),
      title: item.title,
      value: item.value,
    }));

    const document = await termandconditionmodel.findById(id);
    if (!document) {
      return errorResponse(res, 404, "Document not found");
    }

    // Prevent duplicate section names
    const exists = document.termsandconditions.some(
      (sec) => sec.section.toLowerCase() === section.toLowerCase()
    );
    if (exists) {
      return errorResponse(res, 400, "Section already exists");
    }

    // Push the new section
    document.termsandconditions.push({ section, items: formattedItems });
    await document.save();

    successResponse(res, "Section added successfully", document);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletesectionHandler(req, res) {
  try {
    const { id, sectionid } = req.params;

    const document = await termandconditionmodel.findById(id);
    if (!document) {
      return errorResponse(res, 404, "Document not found");
    }

    const originalLength = document.termsandconditions.length;

    // Filter out the section by sectionid
    document.termsandconditions = document.termsandconditions.filter(
      (sec) => sec._id.toString() !== sectionid
    );

    if (document.termsandconditions.length === originalLength) {
      return errorResponse(res, 404, "Section not found");
    }

    await document.save();

    successResponse(res, "Section deleted successfully", document);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function itemaddsectionHandler(req, res) {
  try {
    const { id, sectionid } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 400, "Items must be a non-empty array");
    }

    const formattedItems = items.map((item) => ({
      _id: new mongoose.Types.ObjectId(),
      title: item.title,
      value: item.value,
    }));

    const document = await termandconditionmodel.findById(id);
    if (!document) {
      return errorResponse(res, 404, "Document not found");
    }

    const section = document.termsandconditions.find(
      (sec) => sec._id.toString() === sectionid
    );

    if (!section) {
      return errorResponse(res, 404, "Section not found");
    }

    section.items.push(...formattedItems);
    await document.save();

    successResponse(res, "Items added successfully", document);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deleteitemfromsectionHandler(req, res) {
  try {
    const { id, sectionid, itemid } = req.params;

    const document = await termandconditionmodel.findById(id);
    if (!document) {
      return errorResponse(res, 404, "Document not found");
    }

    const section = document.termsandconditions.find(
      (sec) => sec._id.toString() === sectionid
    );

    if (!section) {
      return errorResponse(res, 404, "Section not found");
    }

    const originalLength = section.items.length;

    section.items = section.items.filter(
      (item) => item._id.toString() !== itemid
    );

    if (section.items.length === originalLength) {
      return errorResponse(res, 404, "Item not found in section");
    }

    await document.save();
    successResponse(res, "Item deleted successfully", document);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
