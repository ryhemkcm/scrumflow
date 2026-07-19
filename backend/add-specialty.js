const db = require("./db");

try {
    const columns = db
        .prepare("PRAGMA table_info(employees)")
        .all();

    const exists = columns.some(
        (column) => column.name === "specialty"
    );

    if (!exists) {
        db.prepare(`
            ALTER TABLE employees
            ADD COLUMN specialty TEXT
        `).run();

        console.log("Colonne specialty ajoutée avec succès.");
    } else {
        console.log("La colonne specialty existe déjà.");
    }
} catch (error) {
    console.error("Erreur :", error);
} finally {
    db.close();
}