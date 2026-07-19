const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const databaseDirectory = path.join(__dirname, "database");

if (!fs.existsSync(databaseDirectory)) {
    fs.mkdirSync(databaseDirectory, {
        recursive: true,
    });
}

const databasePath = path.join(
    databaseDirectory,
    "scrumflow.db"
);

const db = new Database(databasePath);

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

console.log("Base SQLite connectée :", databasePath);

module.exports = db;