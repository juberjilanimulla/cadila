import { Router } from "express";
import contactclientRouter from "./contactclient.js";




const clientRouter = Router()


clientRouter.use("/contact",contactclientRouter)

export default clientRouter