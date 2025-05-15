import { Router } from "express";
import contactusRouter from "./contactusRouter.js";
import talentRouter from "./talentRouter.js";
import jobapplicantsRouter from "./jobapplicantsRouter.js";
import usersjobRouter from "./usersjobRouter.js";
import viewpdfRouter from "./viewpdfRouter.js";
import usertermandconditionRouter from "./usertermandconditionRouter.js";
const userRouter = Router();

userRouter.use("/contactus", contactusRouter);
userRouter.use("/talent", talentRouter);
userRouter.use("/jobapplicants", jobapplicantsRouter);
userRouter.use("/jobs", usersjobRouter);
userRouter.use("/viewpdf", viewpdfRouter);
userRouter.use("/termsandcondition", usertermandconditionRouter);
export default userRouter;
