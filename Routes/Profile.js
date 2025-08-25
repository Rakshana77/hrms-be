import express from "express";
import Admin from "../models/Admin.js";
import Employee from "../models/Employee.js";
import jwt from "jsonwebtoken";

const router = express.Router();



// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.cookies.token; // 🔹 you set this in login
  if (!token) return res.status(401).json({ success: false, message: "No token provided" });

  jwt.verify(token, "jwt_secret_key", (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: "Invalid token" });

    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  });
};

// ✅ Get Profile (Admin or Employee)
router.get("/", verifyToken, async (req, res) => {
  try {
    let user = null;

    if (req.role === "admin") {
      user = await Admin.findById(req.userId).select("-password");
    } else if (req.role === "employee") {
      user = await Employee.findById(req.userId).select("-password");
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export const ProfileRouter = router;
