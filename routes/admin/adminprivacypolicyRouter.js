import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import privacypolicymodel from "../../model/privacypolicymodel.js";
import mongoose from "mongoose";
const adminprivacypolicyRouter = Router();

adminprivacypolicyRouter.get("/", getprivacypolicyHandler);
adminprivacypolicyRouter.post("/create", createprivacypolicyHandler);
adminprivacypolicyRouter.put(
  "/update/:id/:sectionid/:itemid",
  updateprivacypolicyHandler
);
adminprivacypolicyRouter.delete("/delete/:id", deleteprivacypolicyHandler);
adminprivacypolicyRouter.put(
  "/updatesection/:id/:sectionid",
  updatesectionnameprivacypolicyHandler
);
adminprivacypolicyRouter.post("/:id/addsection", addsectionprivacypolicyHandler);

adminprivacypolicyRouter.delete(
  "/:id/deletesection/:sectionid",
  deletesectionprivacypolicyHandler
);


adminprivacypolicyRouter.post(
  "/:id/additems/:sectionid",
  itemaddsectionprivacypolicyHandler
);
adminprivacypolicyRouter.delete(
  "/:id/deleteitem/:sectionid/:itemid",
  deleteitemfromsectionprivacypolicyHandler
);



export default adminprivacypolicyRouter;

async function getprivacypolicyHandler(req, res) {
  try {
    const privacy = await privacypolicymodel.find();
    successResponse(res, "success", privacy);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createprivacypolicyHandler(req, res) {
  try {
    const { privacypolicy } = req.body;

    if (!privacypolicy || !Array.isArray(privacypolicy)) {
      return errorResponse(res, 400, "Invalid or missing privacypolicy");
    }

    const existing = await privacypolicymodel.findOne();
    if (existing) {
      return errorResponse(res, 400, "privacy policy already exist");
    }
    const privacyandpolicy = await privacypolicymodel.create({
      privacypolicy,
    });
    successResponse(res, "success", privacyandpolicy);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updateprivacypolicyHandler(req, res) {
  try {
    const { id, sectionid, itemid } = req.params;
    const { title, value } = req.body;
    const document = await privacypolicymodel.findById(id);
    if (!document) {
      return errorResponse(res, 404, "Document not found");
    }
    const section = document.privacypolicy.find(
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

async function deleteprivacypolicyHandler(req, res) {
  try {
    const { id } = req.params;
    const privacypolicy = await privacypolicymodel.findByIdAndDelete(id);
    if (!privacypolicy) {
      return errorResponse(res, 404, "Document not found");
    }
    successResponse(res, "success");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updatesectionnameprivacypolicyHandler(req, res) {
  try {
    const { id, sectionid } = req.params;
    const { newsection } = req.body;

    if (!newsection) {
      return errorResponse(res, 400, "New section name is required");
    }

    const document = await privacypolicymodel.findById(id);
    if (!document) {
      return errorResponse(res, 404, "Document not found");
    }

    const section = document.privacypolicy.find(
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

async function addsectionprivacypolicyHandler(req, res) {
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

    const document = await privacypolicymodel.findById(id);
    if (!document) {
      return errorResponse(res, 404, "Document not found");
    }

    // Prevent duplicate section names
    const exists = document.privacypolicy.some(
      (sec) => sec.section.toLowerCase() === section.toLowerCase()
    );
    if (exists) {
      return errorResponse(res, 400, "Section already exists");
    }

    // Push the new section
    document.privacypolicy.push({ section, items: formattedItems });
    await document.save();

    successResponse(res, "Section added successfully", document);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletesectionprivacypolicyHandler(req, res) {
  try {
    const { id, sectionid } = req.params;

    const document = await privacypolicymodel.findById(id);
    if (!document) {
      return errorResponse(res, 404, "Document not found");
    }
    const originalLength = document.privacypolicy.length;
    // Filter out the section by sectionid
    document.privacypolicy = document.privacypolicy.filter(
      (sec) => sec._id.toString() !== sectionid
    );
    if (document.privacypolicy.length === originalLength) {
      return errorResponse(res, 404, "Section not found");
    }
    await document.save();
    successResponse(res, "Section deleted successfully", document);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}


async function itemaddsectionprivacypolicyHandler(req, res) {
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

    const document = await privacypolicymodel.findById(id);
    if (!document) {
      return errorResponse(res, 404, "Document not found");
    }

    const section = document.privacypolicy.find(
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

async function deleteitemfromsectionprivacypolicyHandler(req, res) {
  try {
    const { id, sectionid, itemid } = req.params;

    const document = await privacypolicymodel.findById(id);
    if (!document) {
      return errorResponse(res, 404, "Document not found");
    }

    const section = document.privacypolicy.find(
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
