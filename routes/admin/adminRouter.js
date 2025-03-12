import { Router } from "express";
import admincontactRouter from "./admincontactusRouter.js";

const adminRouter = Router();

adminRouter.use("/contactus", admincontactRouter);

export default adminRouter;
