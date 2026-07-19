const bcrypt = require("bcryptjs");
const db = require("./db");

const createTables = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    specialty TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS team_members (
            team_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,

            PRIMARY KEY (team_id, employee_id),

            FOREIGN KEY (team_id)
                REFERENCES teams(id)
                ON DELETE CASCADE,

            FOREIGN KEY (employee_id)
                REFERENCES employees(id)
                ON DELETE CASCADE
        );
    `);

    console.log("Tables créées avec succès.");
};
const addSpecialtyColumn = () => {
    try {
        db.prepare(`
            ALTER TABLE employees
            ADD COLUMN specialty TEXT
        `).run();

        console.log("Colonne specialty ajoutée.");
    } catch (error) {
        if (error.message.includes("duplicate column name")) {
            console.log("La colonne specialty existe déjà.");
        } else {
            throw error;
        }
    }
};
const addImageColumn = () => {
    try {
        db.prepare(`
            ALTER TABLE employees
            ADD COLUMN image_url TEXT
        `).run();

        console.log("Colonne image_url ajoutée.");
    } catch (error) {
        if (error.message.includes("duplicate column name")) {
            console.log("La colonne image_url existe déjà.");
        } else {
            throw error;
        }
    }
};

const createDefaultAdmin = () => {
    const adminEmail = "admin@test.com";

    const existingAdmin = db
        .prepare(`
            SELECT id
            FROM employees
            WHERE email = ?
        `)
        .get(adminEmail);

    if (existingAdmin) {
        console.log("L’administrateur existe déjà.");
        return;
    }

    const passwordHash = bcrypt.hashSync(
        "Admin123!",
        10
    );

    db.prepare(`
        INSERT INTO employees (
            name,
            email,
            password,
            role
        )
        VALUES (?, ?, ?, ?)
    `).run(
        "Administrateur",
        adminEmail,
        passwordHash,
        "administrator"
    );

    console.log("Administrateur créé avec succès.");
    console.log("Email : admin@test.com");
    console.log("Mot de passe : Admin123!");
};

try {
    createTables();
    addImageColumn();
    addSpecialtyColumn();
    createDefaultAdmin();

    console.log("Initialisation terminée.");
} catch (error) {
    console.error(
        "Erreur pendant l’initialisation :",
        error
    );
} finally {
    db.close();
}