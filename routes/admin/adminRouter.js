import { Router } from "express";
import admincontactRouter from "./admincontactusRouter.js";
import adminDashboardRouter from "./adminDashboardRouter.js";
import adminjobpostingRouter from "./adminjobpostingRouter.js";
import admintalenthireRouter from "./admintalenthireRouter.js";
import adminjobapplicantsRouter from "./adminjobapplicantsRouter.js";
import adminusersRouter from "./adminusersRouter.js";
import adminviewpdfRouter from "./adminviewpdfRouter.js";

const adminRouter = Router();

adminRouter.use("/contactus", admincontactRouter);
adminRouter.use("/dashboard", adminDashboardRouter);
adminRouter.use("/jobposting", adminjobpostingRouter);
adminRouter.use("/hiretalent", admintalenthireRouter);
adminRouter.use("/jobapplicants", adminjobapplicantsRouter);
adminRouter.use("/user", adminusersRouter);
adminRouter.use("/viewpdf", adminviewpdfRouter);
export default adminRouter;
