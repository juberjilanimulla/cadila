import { Router } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import termandconditionmodel from "../../model/termsandconditionmodel.js";

const admintermsandconditionRouter = Router();

export default admintermsandconditionRouter;
admintermsandconditionRouter.get("/", gettermsandconditionHandler);
admintermsandconditionRouter.post("/create", createtermsandconditionHandler);
admintermsandconditionRouter.put(
  "/update/:id/:section",
  updatetermsandconditionHandler
);
admintermsandconditionRouter.delete(
  "/delete/:id",
  deletetermandconditionHandler
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
    const { id, section } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 400, "items must be a non-empty array");
    }

    const updatedDoc = await termandconditionmodel.findOneAndUpdate(
      {
        _id: id,
        "termsandconditions.section": section,
      },
      {
        $set: {
          "termsandconditions.$.items": items,
        },
      },
      { new: true }
    );

    if (!updatedDoc) {
      return errorResponse(res, 404, "Section not found or document not found");
    }

    successResponse(res, "Section updated successfully", updatedDoc);
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
