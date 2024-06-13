import express from "express";
import auth from "./routes/auth.js"
import dotenv from "dotenv"
import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();

const app = express();

console.log(process.env.MONGO_URI);

app.use("/api/auth",auth)

app.listen(8000, () => {
    console.log("Server is running on port 8000");
    connectMongoDB();
});