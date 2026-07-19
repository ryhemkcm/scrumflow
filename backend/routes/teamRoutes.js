const express = require("express");

const db = require("../db");
const authenticateAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// ===================================
// Migration automatique de la table
// ===================================

try {
    const columns = db
        .prepare("PRAGMA table_info(teams)")
        .all();

    const columnNames = columns.map((column) => column.name);

    if (!columnNames.includes("product_owner")) {
        db.prepare(`
            ALTER TABLE teams
            ADD COLUMN product_owner INTEGER
        `).run();

        console.log("Colonne product_owner ajoutée.");
    }

    if (!columnNames.includes("scrum_master")) {
        db.prepare(`
            ALTER TABLE teams
            ADD COLUMN scrum_master INTEGER
        `).run();

        console.log("Colonne scrum_master ajoutée.");
    }

    if (!columnNames.includes("developers")) {
        db.prepare(`
            ALTER TABLE teams
            ADD COLUMN developers TEXT
        `).run();

        console.log("Colonne developers ajoutée.");
    }
} catch (error) {
    console.error(
        "Erreur migration table teams :",
        error
    );
}

// ===================================
// Fonctions utilitaires
// ===================================

const normalizeDeveloperIds = (developers) => {
    if (!Array.isArray(developers)) {
        return [];
    }

    return [
        ...new Set(
            developers
                .map((developerId) => Number(developerId))
                .filter(
                    (developerId) =>
                        Number.isInteger(developerId) &&
                        developerId > 0
                )
        ),
    ];
};

const developersToDatabase = (developers) => {
    return normalizeDeveloperIds(developers).join(",");
};

const parseTeam = (team) => {
    if (!team) {
        return null;
    }

    return {
        ...team,

        product_owner: team.product_owner
            ? Number(team.product_owner)
            : null,

        scrum_master: team.scrum_master
            ? Number(team.scrum_master)
            : null,

        developers: team.developers
            ? team.developers
                  .split(",")
                  .map((developerId) =>
                      Number(developerId.trim())
                  )
                  .filter(
                      (developerId) =>
                          Number.isInteger(developerId) &&
                          developerId > 0
                  )
            : [],
    };
};

const employeeExists = (employeeId) => {
    return db
        .prepare(`
            SELECT id
            FROM employees
            WHERE id = ?
        `)
        .get(employeeId);
};

const employeeHasRole = (employeeId, role) => {
    return db
        .prepare(`
            SELECT id
            FROM employees
            WHERE id = ?
            AND role = ?
        `)
        .get(employeeId, role);
};

const validateTeamMembers = ({
    productOwnerId,
    scrumMasterId,
    developerIds,
}) => {
    if (!Number.isInteger(productOwnerId) || productOwnerId <= 0) {
        return "Le Product Owner est invalide.";
    }

    if (!Number.isInteger(scrumMasterId) || scrumMasterId <= 0) {
        return "Le Scrum Master est invalide.";
    }

    if (productOwnerId === scrumMasterId) {
        return "Le Product Owner et le Scrum Master doivent être différents.";
    }

    const productOwner = employeeHasRole(
        productOwnerId,
        "Product Owner"
    );

    if (!productOwner) {
        return "Le Product Owner sélectionné est introuvable ou possède un rôle invalide.";
    }

    const scrumMaster = employeeHasRole(
        scrumMasterId,
        "Scrum Master"
    );

    if (!scrumMaster) {
        return "Le Scrum Master sélectionné est introuvable ou possède un rôle invalide.";
    }

    if (developerIds.length === 0) {
        return "Sélectionnez au moins un membre.";
    }

    for (const developerId of developerIds) {
        const employee = employeeExists(developerId);

        if (!employee) {
            return `L’employé ${developerId} est introuvable.`;
        }
    }

    if (
        developerIds.includes(productOwnerId) ||
        developerIds.includes(scrumMasterId)
    ) {
        return "Le Product Owner et le Scrum Master ne doivent pas être ajoutés comme membres.";
    }

    return null;
};

// ===================================
// Afficher toutes les équipes
// ===================================

router.get("/", authenticateAdmin, (req, res) => {
    try {
        const teams = db
            .prepare(`
                SELECT
                    id,
                    name,
                    description,
                    product_owner,
                    scrum_master,
                    developers,
                    created_at
                FROM teams
                ORDER BY id DESC
            `)
            .all()
            .map(parseTeam);

        return res.status(200).json(teams);
    } catch (error) {
        console.error(
            "Erreur liste équipes :",
            error
        );

        return res.status(500).json({
            message: "Impossible de récupérer les équipes.",
        });
    }
});

// ===================================
// Ajouter une équipe
// ===================================

router.post("/", authenticateAdmin, (req, res) => {
    try {
        const name = String(
            req.body.name || ""
        ).trim();

        const description = String(
            req.body.description || ""
        ).trim();

        const productOwnerId = Number(
            req.body.product_owner
        );

        const scrumMasterId = Number(
            req.body.scrum_master
        );

        const developerIds = normalizeDeveloperIds(
            req.body.developers
        );

        if (!name) {
            return res.status(400).json({
                message: "Le nom de l’équipe est obligatoire.",
            });
        }

        const validationError = validateTeamMembers({
            productOwnerId,
            scrumMasterId,
            developerIds,
        });

        if (validationError) {
            return res.status(400).json({
                message: validationError,
            });
        }

        const existingTeam = db
            .prepare(`
                SELECT id
                FROM teams
                WHERE LOWER(name) = LOWER(?)
            `)
            .get(name);

        if (existingTeam) {
            return res.status(409).json({
                message: "Cette équipe existe déjà.",
            });
        }

        const developersValue =
            developersToDatabase(developerIds);

        const result = db
            .prepare(`
                INSERT INTO teams (
                    name,
                    description,
                    product_owner,
                    scrum_master,
                    developers
                )
                VALUES (?, ?, ?, ?, ?)
            `)
            .run(
                name,
                description,
                productOwnerId,
                scrumMasterId,
                developersValue
            );

        const newTeam = db
            .prepare(`
                SELECT
                    id,
                    name,
                    description,
                    product_owner,
                    scrum_master,
                    developers,
                    created_at
                FROM teams
                WHERE id = ?
            `)
            .get(result.lastInsertRowid);

        return res.status(201).json(
            parseTeam(newTeam)
        );
    } catch (error) {
        console.error(
            "Erreur ajout équipe :",
            error
        );

        return res.status(500).json({
            message: "Impossible d’ajouter l’équipe.",
        });
    }
});

// ===================================
// Modifier une équipe
// ===================================

router.put("/:id", authenticateAdmin, (req, res) => {
    try {
        const teamId = Number(req.params.id);

        const name = String(
            req.body.name || ""
        ).trim();

        const description = String(
            req.body.description || ""
        ).trim();

        const productOwnerId = Number(
            req.body.product_owner
        );

        const scrumMasterId = Number(
            req.body.scrum_master
        );

        const developerIds = normalizeDeveloperIds(
            req.body.developers
        );

        if (!Number.isInteger(teamId) || teamId <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide.",
            });
        }

        if (!name) {
            return res.status(400).json({
                message: "Le nom de l’équipe est obligatoire.",
            });
        }

        const existingTeam = db
            .prepare(`
                SELECT id
                FROM teams
                WHERE id = ?
            `)
            .get(teamId);

        if (!existingTeam) {
            return res.status(404).json({
                message: "Équipe introuvable.",
            });
        }

        const validationError = validateTeamMembers({
            productOwnerId,
            scrumMasterId,
            developerIds,
        });

        if (validationError) {
            return res.status(400).json({
                message: validationError,
            });
        }

        const duplicateTeam = db
            .prepare(`
                SELECT id
                FROM teams
                WHERE LOWER(name) = LOWER(?)
                AND id != ?
            `)
            .get(name, teamId);

        if (duplicateTeam) {
            return res.status(409).json({
                message: "Ce nom d’équipe est déjà utilisé.",
            });
        }

        const developersValue =
            developersToDatabase(developerIds);

        db.prepare(`
            UPDATE teams
            SET
                name = ?,
                description = ?,
                product_owner = ?,
                scrum_master = ?,
                developers = ?
            WHERE id = ?
        `).run(
            name,
            description,
            productOwnerId,
            scrumMasterId,
            developersValue,
            teamId
        );

        const updatedTeam = db
            .prepare(`
                SELECT
                    id,
                    name,
                    description,
                    product_owner,
                    scrum_master,
                    developers,
                    created_at
                FROM teams
                WHERE id = ?
            `)
            .get(teamId);

        return res.status(200).json(
            parseTeam(updatedTeam)
        );
    } catch (error) {
        console.error(
            "Erreur modification équipe :",
            error
        );

        return res.status(500).json({
            message: "Impossible de modifier l’équipe.",
        });
    }
});

// ===================================
// Supprimer une équipe
// ===================================

router.delete("/:id", authenticateAdmin, (req, res) => {
    try {
        const teamId = Number(req.params.id);

        if (!Number.isInteger(teamId) || teamId <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide.",
            });
        }

        const result = db
            .prepare(`
                DELETE FROM teams
                WHERE id = ?
            `)
            .run(teamId);

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Équipe introuvable.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Équipe supprimée.",
        });
    } catch (error) {
        console.error(
            "Erreur suppression équipe :",
            error
        );

        return res.status(500).json({
            message: "Impossible de supprimer l’équipe.",
        });
    }
});

module.exports = router;