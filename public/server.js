const express = require("express");
const db = require("./database/db");
const path = require("path");
const fs = require("fs");
const os = require("os"); // Adicionar importação do módulo 'os'

// Variável para configurar o IP da máquina

// Definir o caminho da configuração do aplicativo
const localAppDataPathConfig =
  process.env.LOCALAPPDATA || path.join(os.homedir(), ".local", "share");
const appFolderConfig = path.join(localAppDataPathConfig, "FinancEasyV2");
const configPath = path.join(appFolderConfig, "config.json");

const app = express();

function loadConfig() {
  try {
    const data = fs.readFileSync(configPath);
    return JSON.parse(data);
  } catch (error) {
    return {
      ipServidor: "127.0.0.1",
      portaServidor: 3050,
    };
  }
}

const config = loadConfig();
const IP_MAQUINA = config.ipServidor || "127.0.0.1";
const PORT = config.portaServidor || 3050;

// Middleware para JSON
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "../pages")));

// Rota inicial para teste
app.get("/", (req, res) => {
  res.redirect("/home/home.html"); // Redirecionar para a página inicial
});

// Rota para listar receitas
app.get("/api/receitas", (req, res) => {
  const sql = `SELECT * FROM receitas`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar receitas:", err);
      res.status(500).json({ error: "Erro ao buscar receitas" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para listar despesas
app.get("/api/despesas", (req, res) => {
  const sql = `
    SELECT d.*, c.nome AS cartao_nome 
    FROM despesas d 
    LEFT JOIN cartoes c ON d.cartao_id = c.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar despesas:", err.message);
      res.status(500).json({ error: "Erro ao buscar despesas" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para adicionar uma nova despesa
app.post("/api/despesas", (req, res) => {
  const {
    estabelecimento,
    data,
    valor,
    forma_pagamento,
    numero_parcelas,
    cartao_id,
  } = req.body;

  const sql = `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const valorParcela = valor / numero_parcelas;

  db.run(
    sql,
    [
      estabelecimento,
      data,
      valor,
      forma_pagamento,
      numero_parcelas,
      numero_parcelas,
      valorParcela,
      cartao_id,
    ],
    function (err) {
      if (err) {
        console.error("Erro ao adicionar despesa:", err);
        res.status(500).json({ error: "Erro ao adicionar despesa" });
      } else {
        res.json({ id: this.lastID });
      }
    }
  );
});

// Rota para pagar uma despesa
app.post("/api/despesas/:id/pagar", (req, res) => {
  const { id } = req.params;

  const sqlSelect = `SELECT * FROM despesas WHERE id = ?`;
  db.get(sqlSelect, [id], (err, despesa) => {
    if (err || !despesa) {
      console.error("Erro ao buscar despesa:", err);
      return res.status(500).json({ error: "Erro ao buscar despesa" });
    }

    const sqlInsert = `INSERT INTO historico_despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id, data_pagamento) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const sqlDelete = `DELETE FROM despesas WHERE id = ?`;
    const dataPagamento = new Date().toISOString().split("T")[0];

    db.run(
      sqlInsert,
      [
        despesa.estabelecimento,
        despesa.data,
        despesa.valor,
        despesa.forma_pagamento,
        despesa.numero_parcelas,
        despesa.parcelas_restantes,
        despesa.valor_parcela,
        despesa.cartao_id,
        dataPagamento,
      ],
      (err) => {
        if (err) {
          console.error("Erro ao pagar despesa:", err);
          return res.status(500).json({ error: "Erro ao pagar despesa" });
        }

        db.run(sqlDelete, [id], (err) => {
          if (err) {
            console.error("Erro ao excluir despesa:", err);
            return res.status(500).json({ error: "Erro ao excluir despesa" });
          }
          res.json({ status: "success" });
        });
      }
    );
  });
});

// Rota para excluir uma despesa
app.delete("/api/despesas/:id", (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM despesas WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao excluir despesa:", err);
      res.status(500).json({ error: "Erro ao excluir despesa" });
    } else {
      res.json({ changes: this.changes });
    }
  });
});

// Rota para filtrar despesas
app.post("/api/despesas/filtrar", (req, res) => {
  const { dataInicio, dataFim, nome, banco } = req.body;
  let sql = `
    SELECT d.*, c.nome AS cartao_nome, c.banco AS banco_nome 
    FROM despesas d 
    LEFT JOIN cartoes c ON d.cartao_id = c.id 
    WHERE 1=1
  `;
  const params = [];

  if (dataInicio) {
    sql += " AND d.data >= ?";
    params.push(dataInicio);
  }
  if (dataFim) {
    sql += " AND d.data <= ?";
    params.push(dataFim);
  }
  if (nome) {
    sql += " AND d.estabelecimento LIKE ?";
    params.push(`%${nome}%`);
  }
  if (banco) {
    sql += " AND c.banco = ?";
    params.push(banco);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao filtrar despesas:", err.message);
      res.status(500).json({ error: "Erro ao filtrar despesas" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para filtrar histórico de despesas
app.post("/api/historico-despesas/filtrar", (req, res) => {
  const { dataInicio, dataFim, nome } = req.body;
  let sql = `SELECT * FROM historico_despesas WHERE 1=1`;
  const params = [];

  if (dataInicio) {
    sql += ` AND data >= ?`;
    params.push(dataInicio);
  }
  if (dataFim) {
    sql += ` AND data <= ?`;
    params.push(dataFim);
  }
  if (nome) {
    sql += ` AND estabelecimento LIKE ?`;
    params.push(`%${nome}%`);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao filtrar histórico de despesas:", err);
      res.status(500).json({ error: "Erro ao filtrar histórico de despesas" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para filtrar receitas
app.post("/api/receitas/filtrar", (req, res) => {
  const { dataInicio, dataFim } = req.body;
  let sql = `SELECT * FROM receitas WHERE 1=1`;
  const params = [];

  if (dataInicio) {
    sql += ` AND data >= ?`;
    params.push(dataInicio);
  }
  if (dataFim) {
    sql += ` AND data <= ?`;
    params.push(dataFim);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao filtrar receitas:", err);
      res.status(500).json({ error: "Erro ao filtrar receitas" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para marcar receita como recebida
app.post("/api/receitas/:id/receber", (req, res) => {
  const { id } = req.params;

  const sqlSelect = `SELECT * FROM receitas WHERE id = ?`;
  db.get(sqlSelect, [id], (err, receita) => {
    if (err || !receita) {
      console.error("Erro ao buscar receita:", err);
      return res.status(500).json({ error: "Erro ao buscar receita" });
    }

    const sqlInsert = `INSERT INTO historico_receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia, data_recebimento) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const sqlDelete = `DELETE FROM receitas WHERE id = ?`;
    const dataRecebimento = new Date().toISOString().split("T")[0];

    db.run(
      sqlInsert,
      [
        receita.descricao,
        receita.data,
        receita.valor,
        receita.categoria,
        receita.fonte,
        receita.forma_recebimento,
        receita.conta_bancaria,
        receita.recorrente,
        receita.intervalo_recorrencia,
        dataRecebimento,
      ],
      (err) => {
        if (err) {
          console.error("Erro ao marcar receita como recebida:", err);
          return res.status(500).json({ error: "Erro ao marcar receita como recebida" });
        }

        db.run(sqlDelete, [id], (err) => {
          if (err) {
            console.error("Erro ao excluir receita:", err);
            return res.status(500).json({ error: "Erro ao excluir receita" });
          }
          res.json({ status: "success" });
        });
      }
    );
  });
});

// Rota para excluir receita
app.delete("/api/receitas/:id", (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM receitas WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao excluir receita:", err);
      res.status(500).json({ error: "Erro ao excluir receita" });
    } else {
      res.json({ changes: this.changes });
    }
  });
});

// Rota para adicionar receita
app.post("/api/receitas", (req, res) => {
  const {
    descricao,
    valor,
    data,
    categoria,
    fonte,
    forma_recebimento,
    conta_bancaria,
    recorrente,
    intervalo_recorrencia,
  } = req.body;

  if (!descricao || !valor || !data) {
    console.error("Dados inválidos recebidos:", req.body);
    return res.status(400).json({ error: "Dados inválidos. Campos obrigatórios ausentes." });
  }

  const sql = `INSERT INTO receitas (descricao, valor, data, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(
    sql,
    [
      descricao,
      valor,
      data,
      categoria,
      fonte,
      forma_recebimento,
      conta_bancaria,
      recorrente,
      intervalo_recorrencia,
    ],
    function (err) {
      if (err) {
        console.error("Erro ao adicionar receita:", err);
        res.status(500).json({ error: "Erro ao adicionar receita" });
      } else {
        res.json({ id: this.lastID });
      }
    }
  );
});

// Rotas para cartões
app.get("/api/cartoes", (req, res) => {
  const sql = `SELECT * FROM cartoes`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar cartões:", err);
      res.status(500).json({ error: "Erro ao buscar cartões" });
    } else {
      res.json(rows);
    }
  });
});

app.post("/api/cartoes", (req, res) => {
  const { nome, banco, limite, vencimento } = req.body;
  const sql = `INSERT INTO cartoes (nome, banco, limite, vencimento) VALUES (?, ?, ?, ?)`;
  db.run(sql, [nome, banco, limite, vencimento], function (err) {
    if (err) {
      console.error("Erro ao adicionar cartão:", err);
      res.status(500).json({ error: "Erro ao adicionar cartão" });
    } else {
      res.json({ id: this.lastID });
    }
  });
});

app.put("/api/cartoes/:id", (req, res) => {
  const { id } = req.params;
  const { nome, banco, limite } = req.body;
  const sql = `UPDATE cartoes SET nome = ?, banco = ?, limite = ? WHERE id = ?`;
  db.run(sql, [nome, banco, limite, id], function (err) {
    if (err) {
      console.error("Erro ao atualizar cartão:", err);
      res.status(500).json({ error: "Erro ao atualizar cartão" });
    } else {
      res.json({ changes: this.changes });
    }
  });
});

app.delete("/api/cartoes/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM cartoes WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao excluir cartão:", err);
      res.status(500).json({ error: "Erro ao excluir cartão" });
    } else {
      res.json({ changes: this.changes });
    }
  });
});

// Rotas para configurações
app.get("/api/config", (req, res) => {
  const configPath = path.join(appFolderConfig, "config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath));
    res.json(config);
  } else {
    res.status(404).json({ error: "Configuração não encontrada" });
  }
});

// Rota para salvar configurações, incluindo o caminho do banco de dados
app.put("/api/config", (req, res) => {
  const configPath = path.join(appFolderConfig, "config.json");
  const { novaSenha, dbPath, ...restConfig } = req.body;
  let config = {};

  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath));
  }

  const updatedConfig = { ...config, ...restConfig };
  if (novaSenha) {
    updatedConfig.senha = novaSenha;
  }
  if (dbPath) {
    if (!fs.existsSync(dbPath)) {
      return res.status(400).json({ error: "O caminho do banco de dados não existe." });
    }
    updatedConfig.dbPath = dbPath;
  }

  fs.writeFileSync(configPath, JSON.stringify(updatedConfig));
  res.json({ status: "success" });
});

// Rota para selecionar o caminho do banco de dados
app.get("/api/config/select-db-path", async (req, res) => {
  const { dialog } = require("electron");
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled) {
    res.json({ dbPath: null });
  } else {
    res.json({ dbPath: result.filePaths[0] });
  }
});

// Rota para verificar senha
app.post("/api/verificar-senha", (req, res) => {
  const { senha } = req.body;
  const configPath = path.join(appFolderConfig, "config.json");

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath));
    if (config.senha === senha) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Senha incorreta" });
    }
  } else {
    res.status(500).json({ success: false, message: "Configuração não encontrada" });
  }
});

// Rota para inserir valores de teste
app.post("/api/teste/inserir-valores", (req, res) => {
  const sqls = [
    `INSERT INTO cartoes (nome, banco, limite, vencimento) VALUES ('Cartão A', 'Banco A', 1000.00, '2025-01-10');`,
    `INSERT INTO cartoes (nome, banco, limite, vencimento) VALUES ('Cartão B', 'Banco B', 2000.00, '2025-02-15');`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Supermercado', '2025-01-15', 150.00, 'Crédito', 1, 0, 150.00, 1);`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Salário', '2025-01-15', 3000.00, 'Salário', 'Empresa X', 'Transferência', 'Conta Corrente', 1, 'Mensal');`
    // ...adicione mais valores de teste conforme necessário...
  ];

  db.serialize(() => {
    let hasError = false;
    sqls.forEach((sql) => {
      db.run(sql, (err) => {
        if (err) {
          console.error("Erro ao executar SQL:", sql, err);
          hasError = true;
        }
      });
    });

    if (hasError) {
      return res.status(500).json({ error: "Erro ao inserir valores de teste" });
    }
    res.json({ status: "success", message: "Valores de teste inseridos com sucesso!" });
  });
});

// Rota para inserir despesas do ano completo
app.post("/api/teste/inserir-despesas-ano-completo", (req, res) => {
  const sqls = [
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Supermercado', '2025-01-15', 150.00, 'Crédito', 1, 0, 150.00, 1);`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Padaria', '2025-02-10', 50.00, 'Débito', 1, 0, 50.00, 2);`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Farmácia', '2025-03-05', 75.00, 'Dinheiro', 1, 0, 75.00, NULL);`
    // ...adicione mais despesas para os meses restantes...
  ];

  db.serialize(() => {
    let hasError = false;
    sqls.forEach((sql) => {
      db.run(sql, (err) => {
        if (err) {
          console.error("Erro ao executar SQL:", sql, err);
          hasError = true;
        }
      });
    });

    if (hasError) {
      return res.status(500).json({ error: "Erro ao inserir despesas do ano completo" });
    }
    res.json({ status: "success", message: "Despesas do ano completo inseridas com sucesso!" });
  });
});

// Rota para inserir valores de teste
app.post("/api/teste/inserir-valores", (req, res) => {
  const sqls = [
    `INSERT INTO cartoes (nome, banco, limite, vencimento) VALUES ('Cartão A', 'Banco A', 1000.00, '2025-01-10');`,
      `INSERT INTO cartoes (nome, banco, limite, vencimento) VALUES ('Cartão B', 'Banco B', 2000.00, '2025-02-15');`,
      `INSERT INTO cartoes (nome, banco, limite, vencimento) VALUES ('Cartão C', 'Banco C', 3000.00, '2025-03-20');`,

      `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Supermercado', '2025-01-15', 150.00, 'Crédito', 1, 0, 150.00, 1);`,
      `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Padaria', '2025-02-10', 50.00, 'Débito', 1, 0, 50.00, 2);`,
      `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Farmácia', '2025-03-05', 75.00, 'Dinheiro', 1, 0, 75.00, NULL);`,
      `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Restaurante', '2025-04-20', 200.00, 'Crédito', 2, 1, 100.00, 1);`,
      `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Posto de Gasolina', '2025-05-18', 120.00, 'Débito', 1, 0, 120.00, 2);`,
      `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Cinema', '2025-06-25', 60.00, 'Dinheiro', 1, 0, 60.00, NULL);`,
      `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Loja de Roupas', '2025-07-12', 300.00, 'Crédito', 3, 2, 100.00, 1);`,
      `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Supermercado', '2025-08-08', 180.00, 'Débito', 1, 0, 180.00, 2);`,
      `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Padaria', '2025-09-14', 40.00, 'Dinheiro', 1, 0, 40.00, NULL);`,
      `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Farmácia', '2025-10-22', 90.00, 'Crédito', 1, 0, 90.00, 1);`,
      `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Restaurante', '2025-11-30', 250.00, 'Débito', 1, 0, 250.00, 2);`,
      `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Posto de Gasolina', '2025-12-05', 100.00, 'Dinheiro', 1, 0, 100.00, NULL);`,

      `INSERT INTO historico_despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id, data_pagamento) VALUES ('Supermercado', '2025-01-15', 150.00, 'Crédito', 1, 0, 150.00, 1, '2025-01-16');`,
      `INSERT INTO historico_despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id, data_pagamento) VALUES ('Padaria', '2025-02-10', 50.00, 'Débito', 1, 0, 50.00, 2, '2025-02-11');`,

      `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Salário', '2025-01-15', 3000.00, 'Salário', 'Empresa X', 'Transferência', 'Conta Corrente', 1, 'Mensal');`,
      `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Freelance', '2025-02-10', 1500.00, 'Freelance', 'Cliente Y', 'Dinheiro', 'Carteira Digital', 0, NULL);`,
      `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Investimento', '2025-03-20', 500.00, 'Investimentos', 'Corretora Z', 'Pix', 'Poupança', 0, NULL);`,

      `INSERT INTO historico_receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia, data_recebimento) VALUES ('Salário', '2025-01-15', 3000.00, 'Salário', 'Empresa X', 'Transferência', 'Conta Corrente', 1, 'Mensal', '2025-01-16');`,
      `INSERT INTO historico_receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia, data_recebimento) VALUES ('Freelance', '2025-02-10', 1500.00, 'Freelance', 'Cliente Y', 'Dinheiro', 'Carteira Digital', 0, NULL, '2025-02-11');`,

      `INSERT INTO contas_bancarias (nome, tipo) VALUES ('Conta Corrente', 'Conta Corrente');`,
      `INSERT INTO contas_bancarias (nome, tipo) VALUES ('Poupança', 'Poupança');`,
      `INSERT INTO contas_bancarias (nome, tipo) VALUES ('Carteira Digital', 'Carteira Digital');`,

      `INSERT INTO investimentos (nome_ativo, quantidade, valor_investido, data_aquisicao, tipo_investimento, conta_origem, observacoes) VALUES ('Ação XYZ', 100, 5000.00, '2025-01-10', 'Ação', 'Conta Corrente', 'Investimento a longo prazo');`,
      `INSERT INTO investimentos (nome_ativo, quantidade, valor_investido, data_aquisicao, tipo_investimento, conta_origem, observacoes) VALUES ('FII ABC', 50, 3000.00, '2025-02-15', 'FII', 'Poupança', 'Investimento a médio prazo');`,
      `INSERT INTO investimentos (nome_ativo, quantidade, valor_investido, data_aquisicao, tipo_investimento, conta_origem, observacoes) VALUES ('Cripto DEF', 10, 2000.00, '2025-03-20', 'Cripto', 'Carteira Digital', 'Investimento a curto prazo');`
  ];

  db.serialize(() => {
    sqls.forEach((sql) => {
      db.run(sql, (err) => {
        if (err) {
          console.error("Erro ao executar SQL:", sql, err);
          return res.status(500).json({ error: "Erro ao inserir valores de teste" });
        }
      });
    });
    res.json({ status: "success", message: "Valores de teste inseridos com sucesso!" });
  });
});

// Rota para inserir despesas do ano completo
app.post("/api/teste/inserir-despesas-ano-completo", (req, res) => {
  const sqls = [
    // Cartões
    `INSERT INTO cartoes (nome, banco, limite, vencimento) VALUES ('Cartão A', 'Banco A', 1000.00, '2025-01-10')`,
    `INSERT INTO cartoes (nome, banco, limite, vencimento) VALUES ('Cartão B', 'Banco B', 2000.00, '2025-02-15')`,

    // Despesas
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Supermercado', '2025-01-15', 150.00, 'Crédito', 1, 0, 150.00, 1)`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Padaria', '2025-02-10', 50.00, 'Débito', 1, 0, 50.00, 2)`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Farmácia', '2025-03-05', 75.00, 'Dinheiro', 1, 0, 75.00, NULL)`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Restaurante', '2025-04-20', 200.00, 'Crédito', 2, 1, 100.00, 1)`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Posto de Gasolina', '2025-05-18', 120.00, 'Débito', 1, 0, 120.00, 2)`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Cinema', '2025-06-25', 60.00, 'Dinheiro', 1, 0, 60.00, NULL)`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Loja de Roupas', '2025-07-12', 300.00, 'Crédito', 3, 2, 100.00, 1)`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Supermercado', '2025-08-08', 180.00, 'Débito', 1, 0, 180.00, 2)`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Padaria', '2025-09-14', 40.00, 'Dinheiro', 1, 0, 40.00, NULL)`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Farmácia', '2025-10-22', 90.00, 'Crédito', 1, 0, 90.00, 1)`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Restaurante', '2025-11-30', 250.00, 'Débito', 1, 0, 250.00, 2)`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Posto de Gasolina', '2025-12-05', 100.00, 'Dinheiro', 1, 0, 100.00, NULL)`,
    
    // receitas
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Salário', '2025-01-15', 3000.00, 'Salário', 'Empresa X', 'Transferência', 'Conta Corrente', 1, 'Mensal')`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Freelance', '2025-02-10', 1500.00, 'Freelance', 'Cliente Y', 'Dinheiro', 'Carteira Digital', 0, NULL)`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Investimento', '2025-03-20', 500.00, 'Investimentos', 'Corretora Z', 'Pix', 'Poupança', 0, NULL)`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Salário', '2025-04-15', 3000.00, 'Salário', 'Empresa X', 'Transferência', 'Conta Corrente', 1, 'Mensal')`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Freelance', '2025-05-10', 1500.00, 'Freelance', 'Cliente Y', 'Dinheiro', 'Carteira Digital', 0, NULL)`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Investimento', '2025-06-20', 500.00, 'Investimentos', 'Corretora Z', 'Pix', 'Poupança', 0, NULL)`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Salário', '2025-07-15', 3000.00, 'Salário', 'Empresa X', 'Transferência', 'Conta Corrente', 1, 'Mensal')`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Freelance', '2025-08-10', 1500.00, 'Freelance', 'Cliente Y', 'Dinheiro', 'Carteira Digital', 0, NULL)`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Investimento', '2025-09-20', 500.00, 'Investimentos', 'Corretora Z', 'Pix', 'Poupança', 0, NULL)`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Salário', '2025-10-15', 3000.00, 'Salário', 'Empresa X', 'Transferência', 'Conta Corrente', 1, 'Mensal')`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Freelance', '2025-11-10', 1500.00, 'Freelance', 'Cliente Y', 'Dinheiro', 'Carteira Digital', 0, NULL)`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Investimento', '2025-12-20', 500.00, 'Investimentos', 'Corretora Z', 'Pix', 'Poupança', 0, NULL)`
  
  ];

  db.serialize(() => {
    let hasError = false;
    sqls.forEach((sql) => {
      db.run(sql, (err) => {
        if (err) {
          console.error("Erro ao executar SQL:", sql, err);
          hasError = true;
        }
      });
    });

    if (hasError) {
      return res.status(500).json({ error: "Erro ao inserir despesas do ano completo" });
    }
    res.json({ status: "success", message: "Despesas do ano completo inseridas com sucesso!" });
  });
});

// Rota para calcular saldo
app.get("/api/saldo", (req, res) => {
  const sqlDespesas = `SELECT SUM(valor) as totalDespesas FROM despesas`;
  const sqlReceitas = `SELECT SUM(valor) as totalReceitas FROM receitas`;

  db.get(sqlDespesas, [], (err, resultDespesas) => {
    if (err) {
      console.error("Erro ao calcular despesas:", err);
      res.status(500).json({ error: "Erro ao calcular despesas" });
    } else {
      db.get(sqlReceitas, [], (err, resultReceitas) => {
        if (err) {
          console.error("Erro ao calcular receitas:", err);
          res.status(500).json({ error: "Erro ao calcular receitas" });
        } else {
          const saldo =
            (resultReceitas.totalReceitas || 0) - (resultDespesas.totalDespesas || 0);
          res.json({ saldo });
        }
      });
    }
  });
});

// Rota para obter histórico de despesas
app.get("/api/historico-despesas", (req, res) => {
  const sql = `SELECT * FROM historico_despesas`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar histórico de despesas:", err);
      res.status(500).json({ error: "Erro ao buscar histórico de despesas" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para filtrar o histórico de despesas
app.post("/api/historico-despesas/filtrar", (req, res) => {
  const { dataInicio, dataFim, nome } = req.body;
  let sql = `SELECT * FROM historico_despesas WHERE 1=1`;
  const params = [];

  if (dataInicio) {
    sql += ` AND data_pagamento >= ?`;
    params.push(dataInicio);
  }
  if (dataFim) {
    sql += ` AND data_pagamento <= ?`;
    params.push(dataFim);
  }
  if (nome) {
    sql += ` AND estabelecimento LIKE ?`;
    params.push(`%${nome}%`);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao filtrar histórico de despesas:", err);
      res.status(500).json({ error: "Erro ao filtrar histórico de despesas" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para obter histórico de receitas
app.get("/api/historico-receitas", (req, res) => {
  const sql = `SELECT * FROM historico_receitas`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar histórico de receitas:", err);
      res.status(500).json({ error: "Erro ao buscar histórico de receitas" });
    } else {
      res.json(rows);
    }
  });
});
// Rota para filtrar o histórico de receitas
app.post("/api/historico-receitas/filtrar", (req, res) => {
  const { dataInicio, dataFim, nome } = req.body;
  let sql = `SELECT * FROM historico_receitas WHERE 1=1`;
  const params = [];

  if (dataInicio) {
    sql += ` AND data_recebimento >= ?`; // Substituído data_pagamento por data_recebimento
    params.push(dataInicio);
  }
  if (dataFim) {
    sql += ` AND data_recebimento <= ?`; // Substituído data_pagamento por data_recebimento
    params.push(dataFim);
  }
  if (nome) {
    sql += ` AND descricao LIKE ?`;
    params.push(`%${nome}%`);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao filtrar histórico de receitas:", err);
      res.status(500).json({ error: "Erro ao filtrar histórico de receitas" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para obter todas as contas bancárias
app.get("/api/contas-bancarias", (req, res) => {
  const sql = `SELECT * FROM contas_bancarias`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar contas bancárias:", err);
      res.status(500).json({ error: "Erro ao buscar contas bancárias" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para obter dados do dashboard
app.get("/api/dashboard", async (req, res) => {
  try {
    const despesas = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM despesas`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const receitas = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM receitas`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({ despesas, receitas });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    res.status(500).json({ error: "Erro ao buscar dados do dashboard" });
  }
});

// Rota para exportar dados
app.get("/api/exportar-dados", async (req, res) => {
  const { formato } = req.query;

  try {
    let dados;
    switch (formato) {
      case "json":
        dados = await exportarBancoDadosJSON();
        res.setHeader("Content-Type", "application/json");
        break;
      case "csv":
        dados = await exportarBancoDadosCSV();
        res.setHeader("Content-Type", "text/csv");
        break;
      case "sql":
        dados = await exportarBancoDadosSQL();
        res.setHeader("Content-Type", "text/plain");
        break;
      default:
        return res.status(400).json({ error: "Formato inválido" });
    }

    res.send(dados);
  } catch (error) {
    console.error("Erro ao exportar dados:", error);
    res.status(500).json({ error: "Erro ao exportar dados" });
  }
});

// Rota para importar dados
app.post("/api/importar-dados", async (req, res) => {
  const { formato, filePath } = req.body;

  try {
    switch (formato) {
      case "json":
        await importarDadosJSON(filePath);
        break;
      case "csv":
        await importarDadosCSV(filePath);
        break;
      case "sql":
        await importarDadosSQL(filePath);
        break;
      default:
        return res.status(400).json({ error: "Formato inválido" });
    }

    res.json({ status: "success", message: "Dados importados com sucesso!" });
  } catch (error) {
    console.error("Erro ao importar dados:", error);
    res.status(500).json({ error: "Erro ao importar dados" });
  }
});

// Rota para obter investimentos
app.get("/api/investimentos", (req, res) => {
  const sql = `SELECT * FROM investimentos`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar investimentos:", err);
      res.status(500).json({ error: "Erro ao buscar investimentos" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para adicionar um investimento
app.post("/api/investimentos", (req, res) => {
  const {
    nome_ativo,
    quantidade,
    valor_investido,
    data_aquisicao,
    tipo_investimento,
    conta_origem,
    observacoes,
  } = req.body;

  const sql = `INSERT INTO investimentos (nome_ativo, quantidade, valor_investido, data_aquisicao, tipo_investimento, conta_origem, observacoes)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(
    sql,
    [
      nome_ativo,
      quantidade,
      valor_investido,
      data_aquisicao,
      tipo_investimento,
      conta_origem,
      observacoes,
    ],
    function (err) {
      if (err) {
        console.error("Erro ao adicionar investimento:", err);
        res.status(500).json({ error: "Erro ao adicionar investimento" });
      } else {
        res.json({ id: this.lastID });
      }
    }
  );
});

// Rota para excluir um investimento
app.delete("/api/investimentos/:id", (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM investimentos WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao excluir investimento:", err);
      res.status(500).json({ error: "Erro ao excluir investimento" });
    } else {
      res.json({ changes: this.changes });
    }
  });
});

// Rota para obter reservas de emergência
app.get("/api/reservas", (req, res) => {
  const sql = `SELECT * FROM reservas`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar reservas:", err);
      res.status(500).json({ error: "Erro ao buscar reservas" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para adicionar uma reserva de emergência
app.post("/api/reservas", (req, res) => {
  const { descricao, valor, data } = req.body;

  const sql = `INSERT INTO reservas (descricao, valor, data) VALUES (?, ?, ?)`;
  db.run(sql, [descricao, valor, data], function (err) {
    if (err) {
      console.error("Erro ao adicionar reserva:", err);
      res.status(500).json({ error: "Erro ao adicionar reserva" });
    } else {
      res.json({ id: this.lastID });
    }
  });
});

// Rota para excluir uma reserva de emergência
app.delete("/api/reservas/:id", (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM reservas WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao excluir reserva:", err);
      res.status(500).json({ error: "Erro ao excluir reserva" });
    } else {
      res.json({ changes: this.changes });
    }
  });
});

// Rota para obter o objetivo de poupança
app.get("/api/objetivo", (req, res) => {
  const sql = `SELECT * FROM objetivo WHERE id = 1`;
  db.get(sql, [], (err, row) => {
    if (err) {
      console.error("Erro ao buscar objetivo:", err);
      res.status(500).json({ error: "Erro ao buscar objetivo" });
    } else {
      res.json(row || { valor: 0 });
    }
  });
});

// Rota para definir o objetivo de poupança
app.post("/api/objetivo", (req, res) => {
  const { valor } = req.body;

  const sql = `INSERT INTO objetivo (id, valor) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET valor = excluded.valor`;
  db.run(sql, [valor], function (err) {
    if (err) {
      console.error("Erro ao definir objetivo:", err);
      res.status(500).json({ error: "Erro ao definir objetivo" });
    } else {
      res.json({ status: "success" });
    }
  });
});

// Rota para verificar despesas próximas do vencimento
app.get("/api/notificacoes/vencimentos", (req, res) => {
  const sql = `
    SELECT * FROM despesas
    WHERE DATE(data) BETWEEN DATE('now') AND DATE('now', '+3 days')
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar despesas próximas do vencimento:", err);
      res.status(500).json({ error: "Erro ao buscar despesas próximas do vencimento" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para registrar despesas parceladas
app.post("/api/despesas/parceladas", (req, res) => {
  const despesas = req.body;

  const sql = `
    INSERT INTO despesas (
      estabelecimento, data, valor, forma_pagamento, 
      numero_parcelas, parcelas_restantes, valor_parcela, cartao_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const db = require("./database/db");
  const promises = despesas.map((despesa) =>
    new Promise((resolve, reject) => {
      db.run(
        sql,
        [
          despesa.estabelecimento,
          despesa.data,
          despesa.valor,
          despesa.forma_pagamento,
          despesa.numero_parcelas,
          despesa.parcelas_restantes,
          despesa.valor_parcela,
          despesa.cartao_id,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    })
  );

  Promise.all(promises)
    .then(() => res.status(201).json({ message: "Despesas parceladas registradas com sucesso!" }))
    .catch((err) => {
      console.error("Erro ao registrar despesas parceladas:", err.message);
      res.status(500).json({ error: "Erro ao registrar despesas parceladas" });
    });
});

// Rota para servir qualquer página HTML dentro da pasta "pages"
app.get("/pages/:folder/:file", (req, res) => {
  const { folder, file } = req.params;
  const filePath = path.join(__dirname, `../pages/${folder}/${file}`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Página não encontrada");
  }
});

// Rota para corrigir problemas de caminhos
app.get("*", (req, res) => {
  const filePath = path.join(__dirname, "../pages/home/home.html");
  res.sendFile(filePath);
});

module.exports = app; // Exportar o app sem iniciar o servidor
