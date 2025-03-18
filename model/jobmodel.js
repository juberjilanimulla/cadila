import { Schema, model } from "mongoose";

const jobSchema = new Schema(
  {
    jobpostingid: {
      type: Schema.Types.ObjectId,
      ref: "jobposting",
    },
    jobtitle: String,
    name: String,
    email: String,
    mobile: String,
    linkedinlink: String,
    pdf: {
      type: String,
      default: "",
    },
    experience: String,
    salary: String,
    location: String,
    jobdescription: String,
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset() {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset);
}

jobSchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

jobSchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const jobmodels = model("job", jobSchema);
export default jobmodels;
