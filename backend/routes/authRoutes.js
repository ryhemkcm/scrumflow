const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../db");

const router = express.Router();

router.post("/login", (req, res) => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        const password = String(req.body.password || "");

        if (!email || !password) {
            return res.status(400).json({
                message: "Email et mot de passe obligatoires.",
            });
        }

        const employee = db
            .prepare(`
        SELECT id, name, email, password, role
        FROM employees
        WHERE email = ?
      `)
            .get(email);

        if (!employee) {
            return res.status(401).json({
                message: "Adresse email ou mot de passe incorrect.",
            });
        }

        const passwordIsValid = bcrypt.compareSync(
            password,
            employee.password
        );

        if (!passwordIsValid) {
            return res.status(401).json({
                message: "Adresse email ou mot de passe incorrect.",
            });
        }

        if (employee.role !== "administrator") {
            return res.status(403).json({
                message: "Accès réservé à l’administrateur.",
            });
        }

        const token = jwt.sign(
            {
                id: employee.id,
                role: employee.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h",
            }
        );

        return res.status(200).json({
            token,
            employee: {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                role: employee.role,
            },
        });
    } catch (error) {
        console.error("Erreur de connexion :", error);

        return res.status(500).json({
            message: "Erreur interne du serveur.",
        });
    }
});

module.exports = router;