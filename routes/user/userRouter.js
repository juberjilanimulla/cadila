import { Router } from "express";
import contactusRouter from "./contactusRouter.js";
import talentRouter from "./talentRouter.js";
import jobRouter from "./jobRouter.js";

const userRouter = Router();

userRouter.use("/contactus", contactusRouter);
userRouter.use("/talent", talentRouter);
userRouter.use("/job", jobRouter);

export default userRouter;
