const express = require("express");
const mysql = require("mysql2"); // Use mysql2 instead of mysql
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const basicAuth = require("express-basic-auth");

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", "./views"); // Set the views directory

// Define cooldown period (24 hours in milliseconds)
const COOLDOWN = 24 * 60 * 60 * 1000;

// MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Harsh@1234", // Replace with your MySQL password
  database: "coupon_db",
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL Connected");
});

// Middleware to prevent abuse
const preventAbuse = (req, res, next) => {
  const ip = req.ip;
  const browserSession =
    req.cookies.session_id || Math.random().toString(36).substring(7);

  // Check if the IP or browser session has claimed a coupon recently
  const query = `SELECT * FROM claims WHERE ip_address = ? OR browser_session = ? ORDER BY claim_time DESC LIMIT 1`;
  db.query(query, [ip, browserSession], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      const lastClaim = new Date(results[0].claim_time);
      if (Date.now() - lastClaim < COOLDOWN) {
        return res.status(403).json({
          message:
            "You can only claim one coupon per day. Come back again tomorrow after 24 hours",
        });
        alert("You have used your daily coupon limit");
      }
    }

    // Set a cookie for browser session tracking
    res.cookie("session_id", browserSession, { maxAge: COOLDOWN });
    next();
  });
};
app.post("/admin/add-coupon", (req, res) => {
  const { code, is_active } = req.body;

  console.log("Received payload:", { code, is_active }); // Log the payload

  // Validate the input
  if (!code || typeof is_active !== "boolean") {
    console.log("Invalid input:", { code, is_active }); // Log invalid input
    return res.status(400).json({
      message:
        "Invalid input. Please provide a valid coupon code and is_active status.",
    });
  }

  // Insert the new coupon into the database
  const query = `INSERT INTO coupons (code, is_active, is_claimed) VALUES (?, ?, FALSE)`;
  db.query(query, [code, is_active], (err, results) => {
    if (err) {
      console.error("Database error:", err); // Log database errors
      return res.status(500).json({ message: "Database error" });
    }

    console.log("Coupon added successfully:", results); // Log success
    res.json({
      message: "Coupon added successfully!",
      couponId: results.insertId,
    });
  });
});
// Route to render the landing page
app.get("/", (req, res) => {
  res.render("index"); // Render the index.ejs file
});

// Route to render the user interface
app.get("/user", (req, res) => {
  res.render("user"); // Render the user.ejs file
});

// Route to render the admin login page
app.get("/admin", (req, res) => {
  res.render("admin"); // Render the admin.ejs file
});

// Route to claim a coupon
// Route to claim a specific coupon
app.get("/claim-coupon/:couponId", preventAbuse, (req, res) => {
  const couponId = req.params.couponId;

  const query = `SELECT * FROM coupons WHERE id = ? AND is_claimed = FALSE AND is_active = TRUE`;
  db.query(query, [couponId], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.status(404).json({ message: "Coupon not available." });
    }

    const coupon = results[0];
    const updateQuery = `UPDATE coupons SET is_claimed = TRUE WHERE id = ?`;
    db.query(updateQuery, [coupon.id], (err) => {
      if (err) throw err;

      // Record the claim
      const insertQuery = `INSERT INTO claims (coupon_id, ip_address, browser_session) VALUES (?, ?, ?)`;
      db.query(
        insertQuery,
        [coupon.id, req.ip, req.cookies.session_id],
        (err) => {
          if (err) throw err;
          res.json({
            message: "Coupon claimed successfully!",
            coupon: coupon.code, // Send the coupon code in the response
          });
        }
      );
    });
  });
});

// Route to handle admin login
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM admin WHERE username = ? AND password = ?`;
  db.query(query, [username, password], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    res.json({ message: "Login successful." });
  });
});

// Route to render the admin dashboard
app.get("/admin/dashboard", (req, res) => {
  // Fetch all coupons and claims from the database
  const couponsQuery = "SELECT * FROM coupons";
  const claimsQuery = "SELECT * FROM claims";

  db.query(couponsQuery, (err, coupons) => {
    if (err) throw err;

    db.query(claimsQuery, (err, claims) => {
      if (err) throw err;

      // Render the admin dashboard with data
      res.render("admin-dashboard", { coupons, claims });
    });
  });
});

// Route to update coupon details
app.post("/admin/update-coupon", (req, res) => {
  const { id, code, is_active } = req.body;

  const query = `UPDATE coupons SET code = ?, is_active = ? WHERE id = ?`;
  db.query(query, [code, is_active, id], (err, results) => {
    if (err) throw err;

    res.json({ message: "Coupon updated successfully!" });
  });
});

// Route to delete a coupon
app.post("/admin/delete-coupon", (req, res) => {
  const { id } = req.body;

  const query = `DELETE FROM coupons WHERE id = ?`;
  db.query(query, [id], (err, results) => {
    if (err) throw err;

    res.json({ message: "Coupon deleted successfully!" });
  });
});

// Route to delete a user claim
app.post("/admin/delete-claim", (req, res) => {
  const { id } = req.body;

  const query = `DELETE FROM claims WHERE id = ?`;
  db.query(query, [id], (err, results) => {
    if (err) throw err;

    res.json({ message: "Claim deleted successfully!" });
  });
});
// Route to fetch available coupons
app.get("/available-coupons", (req, res) => {
  const query = `SELECT * FROM coupons WHERE is_claimed = FALSE AND is_active = TRUE`;
  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results); // Send the list of available coupons
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
