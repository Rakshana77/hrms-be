import jwt from "jsonwebtoken";

export const verifyAdmin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.json({ Status: false, Error: "Not authenticated" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.json({ Status: false, Error: "Invalid token" });
    if (decoded.role !== "admin")
      return res.json({ Status: false, Error: "Unauthorized" });

    req.adminId = decoded.id;
    next();
  });
};
