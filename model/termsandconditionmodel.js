import { Schema, model } from "mongoose";

const termandconditionSchema = new Schema(
  {
    termsandconditions: [
      {
        section: {
          type: String,
          required: true,
        },
        items: [
          {
            title: {
              type: String,
              required: true,
            },
            value: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset() {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset);
}

termandconditionSchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

termandconditionSchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const termandconditionmodel = model("termandcondition", termandconditionSchema);
export default termandconditionmodel;
