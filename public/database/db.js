const path = require('path');
const fs = require('fs');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

// Obter o caminho do LocalAppData
const localAppDataPath = process.env.LOCALAPPDATA || path.join(os.homedir(), '.local', 'share');

// Definir a pasta do banco dentro do LocalAppData
const appFolder = path.join(localAppDataPath, 'controleFinanceiro');
const defaultDbPath = path.join(appFolder, 'database.db');

// Criar a pasta se não existir
if (!fs.existsSync(appFolder)) {
    fs.mkdirSync(appFolder, { recursive: true });
}

// Modificar o caminho do banco de dados para usar o caminho configurado pelo usuário
const configPath = path.join(appFolder, 'config.json');
let dbPath = defaultDbPath;

if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath));
    if (config.dbPath) {
        dbPath = path.join(config.dbPath, 'database.db');
    }
}

// Criar ou abrir o banco de dados
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