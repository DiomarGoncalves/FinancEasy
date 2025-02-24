const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Obter o caminho do LocalAppData
const localAppDataPath = process.env.LOCALAPPDATA || path.join(os.homedir(), '.local', 'share');

// Definir a pasta do banco dentro do LocalAppData
const appFolder = path.join(localAppDataPath, 'FinancEasyV2');
const defaultDbPath = path.join(appFolder, 'FinancEasy.db');

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
        dbPath = path.join(config.dbPath, 'FinancEasy.db');
    }
}

// Criar ou abrir o banco de dados
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // **Ativar suporte a chaves estrangeiras**
    db.run("PRAGMA foreign_keys = ON");

    // **Tabela de Cartões**
    db.run(`CREATE TABLE IF NOT EXISTS cartoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        banco TEXT NOT NULL,
        limite REAL NOT NULL,
        vencimento TEXT NOT NULL
    )`);

    // **Tabela de Despesas**
    db.run(`CREATE TABLE IF NOT EXISTS despesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estabelecimento TEXT NOT NULL,
        data TEXT NOT NULL,
        valor REAL NOT NULL,
        forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('Crédito', 'Débito', 'Dinheiro', 'Pix')),
        numero_parcelas INTEGER DEFAULT 1,
        parcelas_restantes INTEGER DEFAULT 1,
        valor_parcela REAL NOT NULL,
        cartao_id INTEGER,
        paga INTEGER DEFAULT 0,
        FOREIGN KEY(cartao_id) REFERENCES cartoes(id) ON DELETE SET NULL
    )`);

    // **Tabela de Histórico de Despesas**
    db.run(`CREATE TABLE IF NOT EXISTS historico_despesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estabelecimento TEXT NOT NULL,
        data TEXT NOT NULL,
        valor REAL NOT NULL,
        forma_pagamento TEXT NOT NULL,
        numero_parcelas INTEGER DEFAULT 1,
        parcelas_restantes INTEGER DEFAULT 1,
        valor_parcela REAL NOT NULL,
        cartao_id INTEGER,
        data_pagamento TEXT NOT NULL,
        FOREIGN KEY(cartao_id) REFERENCES cartoes(id) ON DELETE SET NULL
    )`);

    // **Tabela de Receitas**
    db.run(`CREATE TABLE IF NOT EXISTS receitas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        data TEXT NOT NULL,
        valor REAL NOT NULL,
        categoria TEXT NOT NULL,
        fonte TEXT NOT NULL,
        forma_recebimento TEXT NOT NULL CHECK (forma_recebimento IN ('Transferência', 'Pix', 'Dinheiro', 'Cheque')),
        conta_bancaria TEXT NOT NULL,
        recorrente BOOLEAN DEFAULT 0,
        intervalo_recorrencia TEXT
    )`);

    // **Tabela de Histórico de Receitas**
    db.run(`CREATE TABLE IF NOT EXISTS historico_receitas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        data TEXT NOT NULL,
        valor REAL NOT NULL,
        categoria TEXT NOT NULL,
        fonte TEXT NOT NULL,
        forma_recebimento TEXT NOT NULL,
        conta_bancaria TEXT NOT NULL,
        recorrente BOOLEAN DEFAULT 0,
        intervalo_recorrencia TEXT,
        data_recebimento TEXT NOT NULL
    )`);

    // **Tabela de Contas Bancárias**
    db.run(`CREATE TABLE IF NOT EXISTS contas_bancarias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('Conta Corrente', 'Poupança', 'Carteira Digital'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS investimentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_ativo TEXT NOT NULL,
        quantidade REAL NOT NULL,
        valor_investido REAL NOT NULL,
        data_aquisicao TEXT NOT NULL,
        tipo_investimento TEXT NOT NULL CHECK (tipo_investimento IN ('Ação', 'FII', 'Cripto')),
        conta_origem TEXT NOT NULL,
        observacoes TEXT
    )`);

    // **Tabela de Reservas de Emergência**
    db.run(`CREATE TABLE IF NOT EXISTS reservas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        data TEXT NOT NULL
    )`);

    // **Tabela de Objetivo de Poupança**
    db.run(`CREATE TABLE IF NOT EXISTS objetivo (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        valor REAL NOT NULL
    )`);
});

module.exports = db;
