import express from "express";
import dotenv from "dotenv"
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import {v2 as cloudinary} from "cloudinary";

import auth from "./routes/authRoute.js";
import userRoutes from "./routes/userRoute.js";
import postRoutes from "./routes/postRoute.js"
import notificationRoutes from "./routes/notificationRoute.js"

import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const app = express();
const PORT = process.env.PORT || 8000

console.log(process.env.MONGO_URI);

app.use(express.json());
app.use(express.urlencoded({ extended: true}))


app.use(cookieParser());

app.use("/api/auth",auth);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

app.listen(PORT, () => {
    console.log("Server is running on port 8000");
    connectMongoDB();
});