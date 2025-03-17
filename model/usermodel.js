import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "manager", "recruiter"],
      required: true,
    },
    approved: { type: Boolean, default: false }, // Admin/Manager approval system
    tokenotp: { type: String },
    reject: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

// Function to get current time in IST
function currentLocalTimePlusOffset() {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset);
}

// Middleware to update timestamps
userSchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

userSchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

// Prevent more than 10 Managers & 100 Recruiters
userSchema.pre("save", async function (next) {
  if (this.role === "manager") {
    const count = await usermodel.countDocuments({ role: "manager" });
    if (count > 9) {
      return next(new Error("Cannot add more managers. Limit reached (10)."));
    }
  }
  if (this.role === "recruiter") {
    const count = await usermodel.countDocuments({ role: "recruiter" });
    if (count > 99) {
      return next(
        new Error("Cannot add more recruiters. Limit reached (100).")
      );
    }
  }
  next();
});

// Admin account creation restriction
userSchema.pre("save", async function (next) {
  if (this.role === "Admin") {
    const count = await usermodel.countDocuments({ role: "Admin" });
    if (count > 0) {
      return next(new Error("Admin account already exists."));
    }
  }
  next();
});

const usermodel = model("user", userSchema);
export default usermodel;
