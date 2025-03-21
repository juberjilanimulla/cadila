import { Router } from "express";
import { errorResponse } from "../../helpers/serverResponse.js";

const adminjobapplicantsRouter = Router();

adminjobapplicantsRouter.post("/getall", getalljobapplicantsHandler);

export default adminjobapplicantsRouter;

async function getalljobapplicantsHandler(req, res) {
  try {
    
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
