import { Router } from "express";
import managerjobpostingRouter from "./managerjobpostingRouter.js";
import dashboradmanagerRouter from "./dashboardmanagerRouter.js";
import recruitermanagerRouter from "./recruitermanagerRouter.js";
import managerjobapplicantsRouter from "./managerjobapplicantsRouter.js";

const managerRouter = Router();

managerRouter.use("/jobposting", managerjobpostingRouter);
managerRouter.use("/dashboard", dashboradmanagerRouter);
managerRouter.use("/recruiter", recruitermanagerRouter);
managerRouter.use("/jobapplicants", managerjobapplicantsRouter);
export default managerRouter;
