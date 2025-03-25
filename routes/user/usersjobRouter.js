import { Router } from "express";

const usersjobRouter = Router();

usersjobRouter.get("/getall", getalljobsHandler);

export default usersjobRouter;

async function getalljobsHandler(req, res) {
  try {
    const jobs = await jobmodels.find();
    successResponse(res, "success", job);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
