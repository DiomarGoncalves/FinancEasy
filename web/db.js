const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

// Cria a tabela de cartões se ela não existir
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS cartoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            banco TEXT NOT NULL,
            limite REAL NOT NULL
        )
    `);
});

// Criar tabela de despesas se não existir
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS despesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estabelecimento TEXT,
        data TEXT,
        valor REAL,
        forma_pagamento TEXT,
        numero_parcelas INTEGER,
        parcelas_restantes INTEGER,
        valor_parcela REAL
    )`);
});

module.exports = db;
