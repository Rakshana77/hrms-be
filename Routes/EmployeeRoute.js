

import express from "express";
import Employee from "../models/Employee.js";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const EmployeeRouter = express.Router();

// 📂 Multer config for file uploads (employee image)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Public/Images"); // make sure Public/Images exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

EmployeeRouter.post("/signup", async (req, res) => {
  try {
    // 1️⃣ Check if email already exists
    const existingEmployee = await Employee.findOne({ email: req.body.email });
    if (existingEmployee) {
      return res.json({ Status: false, Error: "Email already registered" });
    }

    // 2️⃣ Hash password
    const hash = await bcrypt.hash(req.body.password, 10);

    // 3️⃣ Create new employee
    const newEmployee = new Employee({
      name: req.body.name,
      email: req.body.email,
      password: hash,
      address: req.body.address,
      salary: req.body.salary || 0,
      category: req.body.category || null,
      image: req.body.image || null,
    });

    await newEmployee.save();

    // 4️⃣ Generate JWT for immediate login
    const token = jwt.sign(
      { id: newEmployee._id, role: "employee" },
      "jwt_secret_key",
      { expiresIn: "1d" }
    );

    // 5️⃣ Send cookie + success response
    res.cookie("token", token, { httpOnly: true, sameSite: "strict" });
    res.json({
      Status: true,
      Message: "Employee registered & logged in successfully",
      id: newEmployee._id,
      role: "employee"
    });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});


// ✅ Employee Logout
EmployeeRouter.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ Status: true });
});

// ✅ Add Employee (with image upload)
EmployeeRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const employee = new Employee({
      ...req.body,
      image: req.file ? req.file.filename : null,
    });
    await employee.save();
    res.status(201).json({ Status: true, Result: employee });
  } catch (err) {
    res.status(400).json({ Status: false, Error: err.message });
  }
});

// ✅ Get Employees (with filter + pagination)
EmployeeRouter.get("/", async (req, res) => {
  try {
    const { name, email, category, page = 1, limit = 5 } = req.query;

    let filter = {};
    if (name) filter.name = new RegExp(name, "i");
    if (email) filter.email = new RegExp(email, "i");
    if (category) filter.category = category;

    const skip = (page - 1) * limit;

    const employees = await Employee.find(filter)
      .populate("category", "name")
      .skip(skip)
      .limit(Number(limit));

    const total = await Employee.countDocuments(filter);

    res.json({
      Status: true,
      Result: employees,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ Status: false, Error: err.message });
  }
});

// ✅ Get Employee by ID (with category)
EmployeeRouter.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate(
      "category",
      "name"
    );
    if (!employee) return res.status(404).json({ Status: false, Error: "Employee not found" });
    res.json({ Status: true, Result: employee });
  } catch (err) {
    res.status(500).json({ Status: false, Error: err.message });
  }
});


EmployeeRouter.put("/edit_employee/:id", async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        salary: req.body.salary,
        address: req.body.address,
        category: req.body.category,
      },
      { new: true, runValidators: true }
    );
    if (!updated) return res.json({ Status: false, Error: "Employee not found" });
    res.json({ Status: true, Result: updated });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});

// Delete employee
EmployeeRouter.delete("/delete_employee/:id", async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) return res.json({ Status: false, Error: "Employee not found" });
    res.json({ Status: true, Message: "Employee deleted successfully" });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});
