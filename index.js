
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import Jwt from "jsonwebtoken";
import dotenv from "dotenv";

import connectDB from "./utils/db.js";               // MongoDB connection
import { adminRouter } from "./Routes/AdminRoute.js";
import { EmployeeRouter } from "./Routes/EmployeeRoute.js";
import { ProfileRouter } from "./Routes/Profile.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173"],   // frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("Public"));     // for images

// Connect MongoDB
connectDB();

// Routes
app.use("/auth", adminRouter);
app.use("/employee", EmployeeRouter);
   // Admin & general auth routes
// Employee routes
app.use("/profile", ProfileRouter);
// JWT Verification Middleware
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    Jwt.verify(token, "jwt_secret_key", (err, decoded) => {
      if (err) return res.json({ Status: false, Error: "Wrong Token" });
      req.id = decoded.id;
      req.role = decoded.role;
      next();
    });
  } else {
    return res.json({ Status: false, Error: "Not authenticated" });
  }
};

// Verify Endpoint
app.get("/verify", verifyUser, (req, res) => {
  return res.json({ Status: true, role: req.role, id: req.id });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
