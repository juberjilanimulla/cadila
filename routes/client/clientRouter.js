import { Router } from "express";
import contactusRouter from "./contactusRouter.js";
import talentRouter from "./talentRouter.js";
import jobRouter from "./jobRouter.js";

const clientRouter = Router();

clientRouter.use("/contactus", contactusRouter);
clientRouter.use("/talent", talentRouter);
clientRouter.use("/job", jobRouter);

export default clientRouter;
