
import { Schema,model } from "mongoose";

const contactSchema = new Schema({
    firstname:String,
    lastname:String,
    companyName:String,
    mobile:Number,
    email:String,
   message:String,
},{timestamps:true,versionKey:false})

function currentLocalTimePlusOffset(){
    const now = new Date();
    const offset = 5.5*60*60*1000;
    return new Date(now.getTime()+offset)
}

contactSchema.pre("save",function (next){
    const currentTime = currentLocalTimePlusOffset();
    this.createdAt=currentTime;
    this.updatedAt=currentTime;
    next();
})

contactSchema.pre("findOneAndUpdate",function (next){
    const currentTime = currentLocalTimePlusOffset();
    this.set({updatedAt:currentTime});
    next()
})

const contactmodel =model("contact",contactSchema);
export default contactmodel