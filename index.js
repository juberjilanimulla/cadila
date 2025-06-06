import express from "express";
import dbConnect from "./db.js";
import config from "./config.js";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import {
  Admin,
  authMiddleware,
  isAdminMiddleware,
} from "./helpers/helperFunction.js";
import authRouter from "./routes/auth/authRouter.js";
import adminRouter from "./routes/admin/adminRouter.js";
import managerRouter from "./routes/manager/managerRouter.js";
import recruiterRouter from "./routes/recruiter/recruiterRouter.js";
import userRouter from "./routes/user/userRouter.js";

const app = express();
const port = config.PORT;
// const prod = config.PRODDEV === "prod";

app.set("trust proxy", true);
morgan.token("remote-addr", function (req) {
  return req.headers["x-forwarded-for"] || req.socket.remoteAddress;
});

morgan.token("url", (req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  return req.originalUrl;
});

app.use(
  morgan(
    ":remote-addr :method :url :status :res[content-length] - :response-time ms"
  )
);

//middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.json({ limit: "10mb" }));

// Error handling middleware for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON input" });
  }
  next(err); // Pass to the next middleware if not a JSON error
});

// Default error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// app.use("/api/upload", authMiddleware, express.static(path.join("..", "pdfs")));

//routing
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", authMiddleware, isAdminMiddleware, adminRouter);
app.use("/api/manager", authMiddleware, managerRouter);
app.use("/api/recruiter", authMiddleware, recruiterRouter);
app.use("/api/pdf", express.static("./pdfs"));
//productions
// if (prod) {
//   app.use("/", express.static(config.FRONTEND_PATH));
//   app.get("/*", (req, res) => {
//     res.sendFile("index.html", { root: config.FRONTEND_PATH });
//   });

//   console.log("staring production server");
// }

// not found
// app.use("*", (req, res) => {
//   res.status(403).json({
//     message: "not found",
//   });
// });

//email sender

//database
dbConnect()
  .then(() => {
    Admin();
    app.listen(port, () => {
      console.log(`server is listening at ${port}`);
    });
  })
  .catch((error) => {
    console.log("unable to connected to database", error);
  });
