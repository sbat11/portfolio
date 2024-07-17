import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import ImageKit from "imagekit";
import dotenv from 'dotenv';

import authRoutes from "./routes/authRoute.js";
import userRoutes from "./routes/userRoute.js";
import postRoutes from "./routes/postRoute.js";
import notificationRoutes from "./routes/notificationRoute.js";

import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();
const imagekit = new ImageKit({
    publicKey: "public_3drUYVPhfAdqQjgWKZQ/Zi54qR0=",
    privateKey: "private_nCy9YDmZcf2ItA1ILVa3lfSdKGk=",
    urlEndpoint: "https://ik.imagekit.io/sbat11",
});

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.use(express.json({ limit: "100mb" })); // to parse req.body
app.use(express.urlencoded({ extended: true })); // to parse form data(urlencoded)

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    })
}

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
	connectMongoDB();
});