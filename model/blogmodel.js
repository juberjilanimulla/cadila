import { Schema, model } from "mongoose";

const blogSchema = new Schema(
  {
    title: {
      type: String,
    },
    metatitle: {
      type: String,
    },
    metadescription: {
      type: String,
    },
    keywords: {
      type: String,
    },
    coverimage: {
      type: String,
      default: "",
    },

    content: [
      {
        title: String,
        description: String,
      },
    ],
    author: {
      type: String,
      default: "Cadila Global Services",
    },
    published: {
      type: Boolean,
      default: false,
    },
    featured: {
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

blogSchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

blogSchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const blogmodel = model("blog", blogSchema);
export default blogmodel;
