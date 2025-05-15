import { model, Schema, trusted } from "mongoose";

const privacypolicySchema = new Schema(
  {
    privacypolicySchema: [
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
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset() {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset);
}

privacypolicySchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

privacypolicySchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const privacypolicymodel = model("privacypolicy", privacypolicySchema);
export default privacypolicymodel;
