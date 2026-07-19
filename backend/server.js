require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const teamRoutes = require("./routes/teamRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================
// Middlewares
// ==========================

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// ==========================
// Routes
// ==========================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Backend opérationnel.",
    });
});

app.use("/api", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/teams", teamRoutes);

// ==========================
// 404
// ==========================

app.use((req, res) => {
    res.status(404).json({
        message: "Route introuvable.",
    });
});

// ==========================
// Start Server
// ==========================

app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});