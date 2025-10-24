const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const cookieParser = require("cookie-parser");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
require("dotenv").config();

const app = express();

// Set EJS as the template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Enable layouts
app.use(expressLayouts);
app.set("layout", "layout"); // default layout file: views/layout.ejs


app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files (for CSS, JS, etc.)
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	port: process.env.DB_PORT,
});

// Create users table if it doesn't exist
(async () => {
	const client = await pool.connect();
	await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `);
	client.release();
})();

// Middleware to check JWT
function verifyToken(req, res, next) {
	const token = req.cookies.token;
	if (!token) return res.redirect("/login");

	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		if (err) return res.redirect("/login");
		req.user = user;
		next();
	});
}

// Home page
app.get("/", (req, res) => {
	const token = req.cookies.token;
	if (!token) return res.render("index", { user: null, title: "Home Page" });

	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		res.render("index", { user: err ? null : user, title: "Home Page" });
	});
});

// Register routes
app.get("/register", (req, res) => {
	res.render("register", { title: "Register Page", message: null });
});

app.post("/register", async (req, res) => {
	const { email, password } = req.body;
	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		await pool.query(
			"INSERT INTO users (email, password) VALUES ($1, $2)",
			[email, hashedPassword]
		);
		res.render("login", {
			message: "Registration successful! Please log in.",
			title: "Login Page"
		});
	} catch (err) {
		console.error(err);
		res.render("register", {
			message: "User already exists or invalid data.",
			title: "Register Page"
		});
	}
});

// Login routes
app.get("/login", (req, res) => {
	res.render("login", { title: "Login Page", message: null });
});

app.post("/login", async (req, res) => {
	const { email, password } = req.body;
	try {
		const result = await pool.query(
			"SELECT * FROM users WHERE email = $1",
			[email]
		);
		if (result.rows.length === 0)
			return res.render("login", { message: "Invalid credentials", title: "Login Page" });

		const user = result.rows[0];
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch)
			return res.render("login", { message: "Invalid credentials", title: "Login Page" });

		const token = jwt.sign(
			{ id: user.id, email: user.email },
			process.env.JWT_SECRET,
			{ expiresIn: "1h" }
		);

		res.cookie("token", token, { httpOnly: true });
		res.redirect("/profile");
	} catch (err) {
		console.error(err);
		res.render("login", { message: "Server error", title: "Login Page" });
	}
});

// Profile (protected)
app.get("/profile", verifyToken, (req, res) => {
	res.render("profile", { user: req.user, title: "Profile Page" });
});

// Logout
app.get("/logout", (req, res) => {
	res.clearCookie("token");
	res.redirect("/");
});

app.listen(process.env.PORT, () =>
	console.log(`Server running on port ${process.env.PORT}`)
);
