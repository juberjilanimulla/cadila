import { Router } from "express";
import admincontactRouter from "./admincontactusRouter.js";
import adminDashboardRouter from "./adminDashboardRouter.js";
import adminjobpostingRouter from "./adminjobpostingRouter.js";
import admintalenthireRouter from "./admintalenthireRouter.js";

const adminRouter = Router();

adminRouter.use("/contactus", admincontactRouter);
adminRouter.use("/dashboard", adminDashboardRouter);
adminRouter.use("/jobposting", adminjobpostingRouter);
adminRouter.use("/hiretalent", admintalenthireRouter);

export default adminRouter;

