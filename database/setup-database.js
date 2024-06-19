const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
db.serialize(() => {
    // Criação das tabelas
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            category_id INTEGER,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            limite REAL NOT NULL,
            due_date TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS monthly_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT NOT NULL,
            amount REAL NOT NULL,
            card_id INTEGER,
            FOREIGN KEY (card_id) REFERENCES cards (id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS card_bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            due_date TEXT NOT NULL,
            paid INTEGER NOT NULL,
            FOREIGN KEY (card_id) REFERENCES cards (id)
        )
    `);
});

module.exports = db;
