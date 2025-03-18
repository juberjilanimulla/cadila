import { Router } from "express";
import jobpostingrecruiterRouter from "./jobpostingrecruiterRouter.js";

const recruiterRouter = Router();

recruiterRouter.use("/jobposting", jobpostingrecruiterRouter);
export default recruiterRouter;
