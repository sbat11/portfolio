import express from "express";
import auth from "./routes/auth.js"
import dotenv from "dotenv"
import connectMongoDB from "./db/connectMongoDB.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000

console.log(process.env.MONGO_URI);

app.use(express.json());
app.use(express.urlencoded({ extended: true}))


app.use(cookieParser());

app.use("/api/auth",auth)

app.listen(PORT, () => {
    console.log("Server is running on port 8000");
    connectMongoDB();
});