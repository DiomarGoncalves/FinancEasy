require('dotenv').config(); // Carregar variáveis de ambiente do arquivo .env
const { Pool } = require('pg');

// Configuração do banco de dados PostgreSQL (Neon)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // URL do banco de dados fornecida
    ssl: { rejectUnauthorized: false } // Necessário para conexões seguras
});

// Função para executar queries
const db = {
    query: (text, params) => pool.query(text, params),
};

// Criação das tabelas
(async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nome TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                senha TEXT NOT NULL,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS cartoes (
                id SERIAL PRIMARY KEY,
                nome TEXT NOT NULL,
                banco TEXT NOT NULL,
                limite NUMERIC NOT NULL,
                vencimento DATE NOT NULL,
                limite_gasto NUMERIC DEFAULT 0,
                limite_disponivel NUMERIC GENERATED ALWAYS AS (limite - limite_gasto) STORED,
                usuario_id INTEGER NOT NULL,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS despesas (
                id SERIAL PRIMARY KEY,
                estabelecimento TEXT NOT NULL,
                data DATE NOT NULL,
                valor NUMERIC NOT NULL,
                forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('Crédito', 'Débito', 'Dinheiro', 'Pix')),
                numero_parcelas INTEGER DEFAULT 1,
                parcelas_restantes INTEGER DEFAULT 1,
                valor_parcela NUMERIC NOT NULL,
                cartao_id INTEGER,
                paga BOOLEAN DEFAULT FALSE,
                usuario_id INTEGER NOT NULL,
                FOREIGN KEY(cartao_id) REFERENCES cartoes(id) ON DELETE SET NULL,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS historico_despesas (
                id SERIAL PRIMARY KEY,
                estabelecimento TEXT NOT NULL,
                data DATE NOT NULL,
                valor NUMERIC NOT NULL,
                forma_pagamento TEXT NOT NULL,
                numero_parcelas INTEGER DEFAULT 1,
                parcelas_restantes INTEGER DEFAULT 1,
                valor_parcela NUMERIC NOT NULL,
                cartao_id INTEGER,
                data_pagamento DATE NOT NULL,
                usuario_id INTEGER NOT NULL,
                FOREIGN KEY(cartao_id) REFERENCES cartoes(id) ON DELETE SET NULL,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS receitas (
                id SERIAL PRIMARY KEY,
                descricao TEXT NOT NULL,
                data DATE NOT NULL,
                valor NUMERIC NOT NULL,
                categoria TEXT NOT NULL,
                fonte TEXT NOT NULL,
                forma_recebimento TEXT NOT NULL CHECK (forma_recebimento IN ('Transferência', 'Pix', 'Dinheiro', 'Cheque')),
                conta_bancaria TEXT NOT NULL,
                recorrente BOOLEAN DEFAULT FALSE,
                intervalo_recorrencia TEXT,
                usuario_id INTEGER NOT NULL,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS historico_receitas (
                id SERIAL PRIMARY KEY,
                descricao TEXT NOT NULL,
                data DATE NOT NULL,
                valor NUMERIC NOT NULL,
                categoria TEXT NOT NULL,
                fonte TEXT NOT NULL,
                forma_recebimento TEXT NOT NULL,
                conta_bancaria TEXT NOT NULL,
                recorrente BOOLEAN DEFAULT FALSE,
                intervalo_recorrencia TEXT,
                data_recebimento DATE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS contas_bancarias (
                id SERIAL PRIMARY KEY,
                nome TEXT NOT NULL,
                tipo TEXT NOT NULL CHECK (tipo IN ('Conta Corrente', 'Poupança', 'Carteira Digital'))
            );

            CREATE TABLE IF NOT EXISTS investimentos (
                id SERIAL PRIMARY KEY,
                nome_ativo TEXT NOT NULL,
                quantidade NUMERIC NOT NULL,
                valor_investido NUMERIC NOT NULL,
                data_aquisicao DATE NOT NULL,
                tipo_investimento TEXT NOT NULL CHECK (tipo_investimento IN ('Ação', 'FII', 'Cripto')),
                conta_origem TEXT NOT NULL,
                observacoes TEXT,
                usuario_id INTEGER NOT NULL,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS reservas (
                id SERIAL PRIMARY KEY,
                descricao TEXT NOT NULL,
                valor NUMERIC NOT NULL,
                data DATE NOT NULL,
                usuario_id INTEGER NOT NULL,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS objetivo (
                id SERIAL PRIMARY KEY CHECK (id = 1),
                valor NUMERIC NOT NULL,
                usuario_id INTEGER NOT NULL,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS comissoes (
                id SERIAL PRIMARY KEY,
                nf TEXT NOT NULL,
                pedidoNectar TEXT NOT NULL,
                notaNectar TEXT NOT NULL,
                valorVenda NUMERIC NOT NULL,
                dataVenda DATE NOT NULL,
                recebido BOOLEAN DEFAULT FALSE,
                usuario_id INTEGER NOT NULL,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS historico_comissoes (
                id SERIAL PRIMARY KEY,
                nf TEXT NOT NULL,
                pedidoNectar TEXT NOT NULL,
                notaNectar TEXT NOT NULL,
                valorVenda NUMERIC NOT NULL,
                dataVenda DATE NOT NULL,
                valorComissao NUMERIC NOT NULL,
                dataRecebimento DATE NOT NULL,
                usuario_id INTEGER NOT NULL,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            );

            ALTER TABLE cartoes ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;
            ALTER TABLE despesas ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;
            ALTER TABLE receitas ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;
            ALTER TABLE investimentos ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;
            ALTER TABLE reservas ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;
            ALTER TABLE objetivo ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;
            ALTER TABLE comissoes ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;
        `);
        console.log("Tabelas criadas com sucesso!");
    } catch (error) {
        console.error("Erro ao criar tabelas:", error);
    }
})();

module.exports = db;
