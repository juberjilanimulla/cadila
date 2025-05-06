import { Schema, model } from "mongoose";

const talentSchema = new Schema(
  {
    companyname: String,
    email: String,
    jobrole: String,
    jobdescription: String,
    mobile: String,
    termsaccepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset() {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset);
}

talentSchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

talentSchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const talentmodel = model("talent", talentSchema);
export default talentmodel;
