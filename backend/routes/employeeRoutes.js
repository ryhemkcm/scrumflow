const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const db = require("../db");
const authenticateAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Ajouter automatiquement la colonne specialty
try {
    const employeeColumns = db
        .prepare("PRAGMA table_info(employees)")
        .all();

    const specialtyExists = employeeColumns.some(
        (column) => column.name === "specialty"
    );

    if (!specialtyExists) {
        db.prepare(`
            ALTER TABLE employees
            ADD COLUMN specialty TEXT
        `).run();

        console.log("Colonne specialty ajoutée avec succès.");
    } else {
        console.log("La colonne specialty existe déjà.");
    }
} catch (error) {
    console.error(
        "Erreur pendant la création de la colonne specialty :",
        error
    );
}
// ==========================
// Configuration upload images
// ==========================

const uploadsDirectory = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadsDirectory)) {
    fs.mkdirSync(uploadsDirectory, {
        recursive: true,
    });
}

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadsDirectory);
    },

    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname);

        const filename =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}` +
            extension;

        callback(null, filename);
    },
});

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024,
    },

    fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith("image/")) {
            callback(null, true);
        } else {
            callback(
                new Error("Le fichier sélectionné doit être une image.")
            );
        }
    },
});

// ==========================
// Liste des employés
// ==========================

router.get("/", authenticateAdmin, (req, res) => {
    try {
        const employees = db
            .prepare(`
                SELECT
                    id,
                    name,
                    email,
                    role,
                    specialty,
                    image_url,
                    created_at
                FROM employees
                ORDER BY id DESC
            `)
            .all();

        res.status(200).json(employees);
    } catch (error) {
        console.error(
            "Erreur récupération employés :",
            error
        );

        res.status(500).json({
            message: "Erreur lors du chargement des employés.",
        });
    }
});

// ==========================
// Ajouter un employé
// ==========================

router.post(
    "/",
    authenticateAdmin,
    upload.single("image"),
    (req, res) => {
        try {
            const {
                name,
                email,
                password,
                role,
                specialty,
            } = req.body || {};

            if (!name || !email || !password) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    message: "Tous les champs obligatoires sont requis.",
                });
            }

            if (role === "Developer" && !specialty) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    message: "La spécialité est obligatoire pour un développeur.",
                });
            }

            const existingEmployee = db
                .prepare(`
                    SELECT id
                    FROM employees
                    WHERE email = ?
                `)
                .get(email);

            if (existingEmployee) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    message: "Email déjà utilisé.",
                });
            }

            const passwordHash = bcrypt.hashSync(
                password,
                10
            );

            const imageUrl = req.file
                ? `/uploads/${req.file.filename}`
                : null;

            const employeeSpecialty =
                role === "Developer"
                    ? specialty
                    : null;

            const result = db
                .prepare(`
                    INSERT INTO employees (
                        name,
                        email,
                        password,
                        role,
                        specialty,
                        image_url
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `)
                .run(
                    name,
                    email,
                    passwordHash,
                    role || "employee",
                    employeeSpecialty,
                    imageUrl
                );

            const employee = db
                .prepare(`
                    SELECT
                        id,
                        name,
                        email,
                        role,
                        specialty,
                        image_url,
                        created_at
                    FROM employees
                    WHERE id = ?
                `)
                .get(result.lastInsertRowid);

            res.status(201).json({
                success: true,
                employee,
            });
        } catch (error) {
            console.error(
                "Erreur création employé :",
                error
            );

            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500).json({
                message: "Erreur lors de la création de l’employé.",
            });
        }
    }
);

// ==========================
// Modifier un employé
// ==========================

router.put(
    "/:id",
    authenticateAdmin,
    upload.single("image"),
    (req, res) => {
        try {
            const employeeId = req.params.id;

            const {
                name,
                email,
                role,
                specialty,
            } = req.body || {};

            if (!name || !email || !role) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    message: "Nom, email et rôle sont obligatoires.",
                });
            }

            if (role === "Developer" && !specialty) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    message: "La spécialité est obligatoire pour un développeur.",
                });
            }

            const existingEmployee = db
                .prepare(`
                    SELECT
                        id,
                        image_url
                    FROM employees
                    WHERE id = ?
                `)
                .get(employeeId);

            if (!existingEmployee) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(404).json({
                    message: "Employé introuvable.",
                });
            }

            const emailAlreadyUsed = db
                .prepare(`
                    SELECT id
                    FROM employees
                    WHERE email = ?
                    AND id != ?
                `)
                .get(email, employeeId);

            if (emailAlreadyUsed) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    message: "Email déjà utilisé par un autre employé.",
                });
            }

            let imageUrl = existingEmployee.image_url;

            if (req.file) {
                imageUrl = `/uploads/${req.file.filename}`;

                if (existingEmployee.image_url) {
                    const oldImagePath = path.join(
                        __dirname,
                        "..",
                        existingEmployee.image_url
                    );

                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
            }

            const employeeSpecialty =
                role === "Developer"
                    ? specialty
                    : null;

            db.prepare(`
                UPDATE employees
                SET
                    name = ?,
                    email = ?,
                    role = ?,
                    specialty = ?,
                    image_url = ?
                WHERE id = ?
            `).run(
                name,
                email,
                role,
                employeeSpecialty,
                imageUrl,
                employeeId
            );

            const updatedEmployee = db
                .prepare(`
                    SELECT
                        id,
                        name,
                        email,
                        role,
                        specialty,
                        image_url,
                        created_at
                    FROM employees
                    WHERE id = ?
                `)
                .get(employeeId);

            res.status(200).json({
                success: true,
                employee: updatedEmployee,
            });
        } catch (error) {
            console.error(
                "Erreur modification employé :",
                error
            );

            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500).json({
                message: "Erreur lors de la modification de l’employé.",
            });
        }
    }
);

// ==========================
// Supprimer un employé
// ==========================

router.delete("/:id", authenticateAdmin, (req, res) => {
    try {
        const employee = db
            .prepare(`
                SELECT
                    id,
                    image_url
                FROM employees
                WHERE id = ?
            `)
            .get(req.params.id);

        if (!employee) {
            return res.status(404).json({
                message: "Employé introuvable.",
            });
        }

        db.prepare(`
            DELETE FROM employees
            WHERE id = ?
        `).run(req.params.id);

        if (employee.image_url) {
            const imagePath = path.join(
                __dirname,
                "..",
                employee.image_url
            );

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.status(200).json({
            success: true,
        });
    } catch (error) {
        console.error(
            "Erreur suppression employé :",
            error
        );

        res.status(500).json({
            message: "Erreur lors de la suppression de l’employé.",
        });
    }
});

// ==========================
// Gestion erreurs Multer
// ==========================

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            message:
                error.code === "LIMIT_FILE_SIZE"
                    ? "L’image ne doit pas dépasser 5 Mo."
                    : "Erreur pendant l’envoi de l’image.",
        });
    }

    if (
        error.message ===
        "Le fichier sélectionné doit être une image."
    ) {
        return res.status(400).json({
            message: error.message,
        });
    }

    next(error);
});

module.exports = router;