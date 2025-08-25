
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";

import Admin from "../models/Admin.js";
import Category from "../models/Category.js";
import Employee from "../models/Employee.js";

const router = express.Router();

// ✅ Admin login
router.post("/adminlogin", async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });
    if (!admin) return res.json({ loginStatus: false, Error: "Wrong email or password" });

    const validPassword = await bcrypt.compare(req.body.password, admin.password);
    if (!validPassword) return res.json({ loginStatus: false, Error: "Wrong email or password" });

    const token = jwt.sign(
      { role: "admin", email: admin.email, id: admin._id },
      "jwt_secret_key",
      { expiresIn: "1d" }
    );
    res.cookie("token", token);
    return res.json({ loginStatus: true });
  } catch (err) {
    return res.json({ loginStatus: false, Error: err.message });
  }
});
router.post("/adminsignup", async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne({ email: req.body.email });
    if (existingAdmin) {
      return res.json({ Status: false, Error: "Email already registered" });
    }

    const hash = await bcrypt.hash(req.body.password, 10);
    const newAdmin = new Admin({
      email: req.body.email,
      password: hash,
    });

    await newAdmin.save();
    res.json({ Status: true, Message: "Admin registered successfully" });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});
// ✅ Category APIs
router.get("/category", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ Status: true, Result: categories });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});

router.post("/add_category", async (req, res) => {
  try {
    const category = new Category({ name: req.body.category });
    await category.save();
    res.json({ Status: true });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});

// ✅ Multer (image upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Public/Images");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Add Employee
router.post("/add_employee", upload.single("image"), async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const employee = new Employee({
      name: req.body.name,
      email: req.body.email,
      password: hash,
      address: req.body.address,
      salary: req.body.salary,
      image: req.file ? req.file.filename : null,
      category: req.body.category,
    });
    await employee.save();
    res.json({ Status: true });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});

// ✅ Get Employees
router.get("/employee", async (req, res) => {
  try {
    const employees = await Employee.find().populate("category", "name");
    res.json({ Status: true, Result: employees });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});

// ✅ Get single Employee
router.get("/employee/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate("category", "name");
    if (!employee) return res.json({ Status: false, Error: "Employee not found" });
    res.json({ Status: true, Result: employee });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});

// ✅ Edit Employee
router.put("/edit_employee/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
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
    res.json({ Status: true, Result: employee });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});

// ✅ Delete Employee
router.delete("/delete_employee/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ Status: true });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});

// ✅ Counts & Aggregates
router.get("/admin_count", async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    res.json({ Status: true, Result: [{ admin: count }] });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});

router.get("/employee_count", async (req, res) => {
  try {
    const count = await Employee.countDocuments();
    res.json({ Status: true, Result: [{ employee: count }] });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});

router.get("/salary_count", async (req, res) => {
  try {
    const result = await Employee.aggregate([{ $group: { _id: null, salaryOFEmp: { $sum: "$salary" } } }]);
    res.json({ Status: true, Result: result });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});

router.get("/admin_records", async (req, res) => {
  try {
    const admins = await Admin.find();
    res.json({ Status: true, Result: admins });
  } catch (err) {
    res.json({ Status: false, Error: err.message });
  }
});

// ✅ Logout
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ Status: true });
});

export { router as adminRouter };
