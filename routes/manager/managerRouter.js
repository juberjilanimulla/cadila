import { Router } from "express";
import managerjobpostingRouter from "./managerjobpostingRouter.js";
import dashboradmanagerRouter from "./dashboardmanagerRouter.js";

const managerRouter = Router();

managerRouter.use("/jobposting", managerjobpostingRouter);
managerRouter.use("/dashboard", dashboradmanagerRouter);
managerRouter.use("/recruiter", recruitermanagerRouter);

export default managerRouter;
