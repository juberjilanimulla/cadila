import { Router } from "express";
import { errorResponse, successResponse } from "../../helpers/serverResponse.js";
import contactmodel from "../../model/usermodel.js";


const contactclientRouter = Router()

contactclientRouter.post("/create",createcontactclientHandler);
contactclientRouter.post("/udpate",updatecontactHandler)
export default contactclientRouter

async function createcontactclientHandler(req,res){
    try {
        const {firstname,lastname,email,mobile,message} = req.body;
        if(!firstname ||!lastname ||!email ||!mobile ||!message){
            return errorResponse(res,400,"some params are missing")
        }
        const params = {
            firstname,lastname,email,mobile,message
        }
        const contact = await contactmodel.create(params);
        successResponse(res,"success",contact)
    } catch (error) {
        console.log("error",error);
        errorResponse(res,500,"internal server error")
    }
}




async function updatecontactHandler(req,res){
    try {
     const {_id,...updatedData} = req.body;
     const options = {new:true};
     if(!updatedData.firstname ||!updatedData.lastname ||!updatedData.email ||!updatedDatamobile ||!updatedData.message){
        return errorResponse(res, 400, 'some params are missing')
     }
     const updated = await contactmodel.findByIdAndUpdate(
        _id,
        updatedData,
        options
     )
     successResponse(res,"success",updated)
    } catch (error) {
        console.log("error",error);
        errorResponse(res,500,"internal server error")
    }
}