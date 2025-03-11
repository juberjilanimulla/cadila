import express from "express"
import dbConnect from "./db.js"
import config from "./config.js"
import clientRouter from "./routes/client/clientRouter.js"
import morgan from "morgan"

const app =express()
const port = config.PORT
//middleware
app.use(express.json())
app.use(
    morgan(
      ":remote-addr :method :url :status :res[content-length] - :response-time ms"
    )
  );
  
//routing
app.use("/api/client",clientRouter)

//not found
app.use("*", (req, res) => {
    res.status(403).json({
      message: "not found",
    });
  });
  

dbConnect()
.then(()=>{
    app.listen(port,()=>{
        console.log(`server is listening at ${port}`)
      })
})
.catch((error)=>{
    console.log("unable to connected to database",error)
})