import { Router } from "express";
import usersjobRouter from "./usersjobRouter.js";
import usertermandconditionRouter from "./usertermandconditionRouter.js";
import userprivacypolicyRouter from "./userprivacypolicyRouter.js";
import usertalentRouter from "./usertalentRouter.js";
import usercontactusRouter from "./usercontactusRouter.js";
import userjobapplicantsRouter from "./userjobapplicantsRouter.js";
import userblogRouter from "./userblogRouter.js";

const userRouter = Router();

userRouter.use("/contactus", usercontactusRouter);
userRouter.use("/talent", usertalentRouter);
userRouter.use("/jobapplicants", userjobapplicantsRouter);
userRouter.use("/jobs", usersjobRouter);
userRouter.use("/termsandcondition", usertermandconditionRouter);
userRouter.use("/privacypolicy", userprivacypolicyRouter);
userRouter.use("/blog", userblogRouter);

export default userRouter;
