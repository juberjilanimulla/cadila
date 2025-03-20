import { Router } from "express";
import contactusRouter from "./contactusRouter.js";
import talentRouter from "./talentRouter.js";
import jobapplicantsRouter from "./jobapplicantsRouter.js";

const userRouter = Router();

userRouter.use("/contactus", contactusRouter);
userRouter.use("/talent", talentRouter);
userRouter.use("/jobapplicants", jobapplicantsRouter);

export default userRouter;
