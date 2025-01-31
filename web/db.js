const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Criar tabela de despesas
    db.run(`CREATE TABLE IF NOT EXISTS despesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estabelecimento TEXT,
        data TEXT,
        valor REAL,
        forma_pagamento TEXT,
        numero_parcelas INTEGER,
        parcelas_restantes INTEGER,
        valor_parcela REAL,
        cartao_id INTEGER
    )`);

    // Criar tabela de cartões
    db.run(`CREATE TABLE IF NOT EXISTS cartoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        banco TEXT,
        limite REAL
    )`);

    // Criar tabela de histórico de despesas
    db.run(`CREATE TABLE IF NOT EXISTS historico_despesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estabelecimento TEXT,
        data TEXT,
        valor REAL,
        forma_pagamento TEXT,
        numero_parcelas INTEGER,
        parcelas_restantes INTEGER,
        valor_parcela REAL,
        cartao_id INTEGER,
        data_pagamento TEXT
    )`);

    // Criar tabela de receitas
    db.run(`CREATE TABLE IF NOT EXISTS receitas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT,
        data TEXT,
        valor REAL,
        forma_recebimento TEXT
    )`);
});

module.exports = db;