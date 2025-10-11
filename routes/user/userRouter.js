import { Router } from "express";
import contactusRouter from "./contactusRouter.js";
import jobapplicantsRouter from "./jobapplicantsRouter.js";
import usersjobRouter from "./usersjobRouter.js";
import viewpdfRouter from "./viewpdfRouter.js";
import usertermandconditionRouter from "./usertermandconditionRouter.js";
import userprivacypolicyRouter from "./userprivacypolicyRouter.js";
import usertalentRouter from "./usertalentRouter.js";
const userRouter = Router();

userRouter.use("/contactus", contactusRouter);
userRouter.use("/talent", usertalentRouter);
userRouter.use("/jobapplicants", jobapplicantsRouter);
userRouter.use("/jobs", usersjobRouter);
userRouter.use("/viewpdf", viewpdfRouter);
userRouter.use("/termsandcondition", usertermandconditionRouter);
userRouter.use("/privacypolicy", userprivacypolicyRouter);
export default userRouter;
