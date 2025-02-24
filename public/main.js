const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os"); // Adicionar importação do módulo 'os'
const db = require("./database/db");
const localAppDataPathConfig =
  process.env.LOCALAPPDATA || path.join(os.homedir(), ".local", "share");
const appFolderConfig = path.join(localAppDataPathConfig, "FinancEasyV2");
const configPath = path.join(appFolderConfig, "config.json");

if (process.env.NODE_ENV === "development") {
  try {
    require("electron-reload")(__dirname);
  } catch (err) {
    console.log("electron-reload não está disponível no ambiente de produção.");
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.maximize();

  mainWindow.loadFile(path.join(__dirname, "..", "pages", "home", "home.html")); // Carrega o arquivo HTML principal
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.whenReady().then(() => {
  // Verificar e criar o diretório de configuração se não existir
  if (!fs.existsSync(appFolderConfig)) {
    fs.mkdirSync(appFolderConfig, { recursive: true });
  }

  // Verificar e criar o arquivo de configuração se não existir
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      tema: "escuro",
      notificacoes: "ativadas",
      limiteGastos: 0,
      dbPath: appFolderConfig,
      senha: "admin",
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig));
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Função para carregar configurações
function loadConfig() {
  try {
    const data = fs.readFileSync(configPath);
    return JSON.parse(data);
  } catch (error) {
    return {
      tema: "escuro",
      notificacoes: "ativadas",
      limiteGastos: 0,
      senha: "admin",
      dbPath: appFolderConfig,
    }; // Configurações padrão
  }
}

// Função para salvar configurações
function saveConfig(config) {
  const { novaSenha, ...restConfig } = config;
  const currentConfig = loadConfig();
  const updatedConfig = { ...currentConfig, ...restConfig };
  if (novaSenha) {
    updatedConfig.senha = novaSenha;
  }
  fs.writeFileSync(configPath, JSON.stringify(updatedConfig));
}

// IPC Handlers para configurações
ipcMain.handle("load-config", async () => {
  return loadConfig();
});

ipcMain.handle("save-config", async (event, config) => {
  saveConfig(config);
  return { status: "success" };
});

// IPC Handler para verificar a senha
ipcMain.handle("verificar-senha", async (event, senha) => {
  const config = loadConfig();
  return config.senha === senha;
});

// Função para obter o limite disponível do cartão
function obterLimiteDisponivel(cartao_id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT limite FROM cartoes WHERE id = ?`;
    db.get(sql, [cartao_id], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        reject(new Error("Cartão não encontrado."));
      } else {
        resolve(row.limite);
      }
    });
  });
}

// Função para mostrar mensagem de aviso na tela
function showMessage(message, type) {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  mainWindow.webContents.executeJavaScript(`
    const messageContainer = document.createElement('div');
    messageContainer.className = 'alert alert-${type}';
    messageContainer.textContent = '${message}';
    document.body.prepend(messageContainer);
    setTimeout(() => {
      messageContainer.remove();
    }, 3000);
  `);
}

// Atualizar o limite do cartão ao adicionar uma despesa
ipcMain.handle("add-despesa", async (event, despesa) => {
  const {
    estabelecimento,
    data,
    valor,
    forma_pagamento,
    numero_parcelas,
    cartao_id,
  } = despesa;
  const valorParcela = valor / numero_parcelas;

  return new Promise(async (resolve, reject) => {
    try {
      if (
        forma_pagamento === "Crédito" ||
        forma_pagamento === "Cartão de Crédito"
      ) {
        const limiteDisponivel = await obterLimiteDisponivel(cartao_id);
        if (limiteDisponivel === undefined) {
          reject(new Error("Cartão não encontrado."));
          return;
        }
        if (limiteDisponivel < valor) {
          showMessage("Limite insuficiente para realizar a compra.", "danger");
          reject(new Error("Limite insuficiente para realizar a compra."));
          return;
        }
      }

      db.serialize(async () => {
        for (let i = 0; i < numero_parcelas; i++) {
          const parcelaData = new Date(data);
          parcelaData.setMonth(parcelaData.getMonth() + i);
          const parcelaDataStr = parcelaData.toISOString().split("T")[0];

          const sql = `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
          db.run(
            sql,
            [
              estabelecimento,
              parcelaDataStr,
              valorParcela,
              forma_pagamento === "Cartão de Crédito"
                ? "Crédito"
                : forma_pagamento,
              numero_parcelas,
              numero_parcelas - i,
              valorParcela,
              cartao_id,
            ],
            function (err) {
              if (err) {
                reject(err);
              }
            }
          );
        }

        // Atualizar o limite do cartão
        const updateSql = `UPDATE cartoes SET limite = limite - ? WHERE id = ?`;
        db.run(updateSql, [valor, cartao_id], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ status: "success" });
          }
        });
      });
    } catch (error) {
      reject(error);
    }
  });
});

// Função para obter todos os cartões
function obterCartoes() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM cartoes`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// IPC Handlers para cartões
ipcMain.handle("get-cartoes", async () => {
  return obterCartoes();
});

ipcMain.handle("add-cartao", async (event, cartao) => {
  const { nome, banco, limite, vencimento } = cartao;

  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO cartoes (nome, banco, limite, vencimento) VALUES (?, ?, ?, ?)`;
    db.run(sql, [nome, banco, limite, vencimento], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
});

ipcMain.handle("delete-cartao", async (event, id) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM cartoes WHERE id = ?`;
    db.run(sql, [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
});

ipcMain.handle("update-cartao", async (event, cartao) => {
  const { id, nome, banco, limite } = cartao;

  return new Promise((resolve, reject) => {
    const sql = `UPDATE cartoes SET nome = ?, banco = ?, limite = ? WHERE id = ?`;
    db.run(sql, [nome, banco, limite, id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
});

// IPC Handlers para despesas
ipcMain.handle("get-despesas", async () => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM despesas`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle("delete-despesa", async (event, id) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM despesas WHERE id = ?`;
    db.run(sql, [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
});

// Função para pagar uma despesa e mover para o histórico
ipcMain.handle("pay-despesa", async (event, id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM despesas WHERE id = ?`;
    db.get(sql, [id], (err, despesa) => {
      if (err) {
        reject(err);
      } else {
        const insertSql = `INSERT INTO historico_despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id, data_pagamento) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const deleteSql = `DELETE FROM despesas WHERE id = ?`;
        const data_pagamento = new Date().toISOString().split("T")[0];

        db.run(
          insertSql,
          [
            despesa.estabelecimento,
            despesa.data,
            despesa.valor,
            despesa.forma_pagamento,
            despesa.numero_parcelas,
            despesa.parcelas_restantes,
            despesa.valor_parcela,
            despesa.cartao_id,
            data_pagamento,
          ],
          function (err) {
            if (err) {
              reject(err);
            } else {
              db.run(deleteSql, [id], function (err) {
                if (err) {
                  reject(err);
                } else {
                  // Devolver o valor ao limite do cartão
                  const updateSql = `UPDATE cartoes SET limite = limite + ? WHERE id = ?`;
                  db.run(
                    updateSql,
                    [despesa.valor, despesa.cartao_id],
                    function (err) {
                      if (err) {
                        reject(err);
                      } else {
                        resolve({ changes: this.changes });
                      }
                    }
                  );
                }
              });
            }
          }
        );
      }
    });
  });
});

// Função para inserir valores de teste
function inserirValoresTeste() {
  return new Promise((resolve, reject) => {
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
            console.error("Erro ao executar SQL:", sql, err); // Log de erro
            reject(err);
          }
        });
      });
      resolve();
    });
  });
}

// Adicione um manipulador IPC para chamar essa função
ipcMain.handle("inserir-valores-teste", async () => {
  await inserirValoresTeste();
  return { status: "success" };
});

function inserirDespesasAnoCompleto() {
  return new Promise((resolve, reject) => {
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
      sqls.forEach((sql) => {
        db.run(sql, (err) => {
          if (err) {
            console.error("Erro ao executar SQL:", sql, err); // Log de erro
            reject(err);
          }
        });
      });
      resolve();
    });
  });
}

// Adicione um manipulador IPC para chamar essa função
ipcMain.handle("inserir-despesas-ano-completo", async () => {
  await inserirDespesasAnoCompleto();
  return "Despesas inseridas para todos os meses do ano de 2025";
});


// Função para limpar o banco de dados
function limparBanco() {
  return new Promise((resolve, reject) => {
    const sqls = [
      `DELETE FROM despesas`,
      `DELETE FROM cartoes`,
      `DELETE FROM historico_despesas`,
      `DELETE FROM receitas`,
      `DELETE FROM historico_receitas`,
      `DELETE FROM contas_bancarias`,
      `DELETE FROM investimentos`,
    ];
    db.serialize(() => {
      sqls.forEach((sql) => {
        db.run(sql, (err) => {
          if (err) {
            console.error("Erro ao executar SQL:", sql, err); // Log de erro
            reject(err);
          }
        });
      });
      resolve();
    });
  });
}

// IPC Handlers para teste e limpeza
ipcMain.handle("limpar-banco", async () => {
  await limparBanco();
  return { status: "success" };
});

// IPC Handlers para receitas
ipcMain.handle("add-receita", async (event, receita) => {
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
    } = receita;

    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO receitas (descricao, valor, data, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            }
        );
    });
});

ipcMain.handle("get-receitas", async () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM receitas`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle("delete-receita", async (event, id) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM receitas WHERE id = ?`;
    db.run(sql, [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
});

// IPC Handlers para filtrar despesas e receitas
ipcMain.handle("get-historicoDespesas-filtradas", async (event, filtros) => {
  const { dataInicio, dataFim, nome } = filtros;
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

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle("get-historicoReceitas-filtradas", async (event, filtros = {}) => {
  const { dataInicio, dataFim, nome } = filtros;
  let sql = `SELECT * FROM historico_receitas WHERE 1=1`;
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
    sql += ` AND descricao LIKE ?`;
    params.push(`%${nome}%`);
  }

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle("get-despesas-filtradas", async (event, filtros) => {
  const { dataInicio, dataFim, nome } = filtros;
  let sql = `SELECT * FROM despesas WHERE 1=1`;
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

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle("get-receitas-filtradas", async (event, filtros) => {
  const { dataInicio, dataFim } = filtros;
  console.log("Filtros recebidos:", filtros); // Log para depuração
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM receitas WHERE data BETWEEN ? AND ?`;
    db.all(sql, [dataInicio, dataFim], (err, rows) => {
      if (err) {
        console.error("Erro ao buscar receitas:", err); // Log de erro
        reject(err);
      } else {
        console.log("Receitas filtradas no banco de dados:", rows); // Log para depuração
        resolve(rows);
      }
    });
  });
});
// IPC Handler para calcular saldo
ipcMain.handle("calcular-saldo", async () => {
  return new Promise((resolve, reject) => {
    const sqlDespesas = `SELECT SUM(valor) as totalDespesas FROM despesas`;
    const sqlReceitas = `SELECT SUM(valor) as totalReceitas FROM receitas`;

    db.get(sqlDespesas, [], (err, resultDespesas) => {
      if (err) {
        reject(err);
      } else {
        db.get(sqlReceitas, [], (err, resultReceitas) => {
          if (err) {
            reject(err);
          } else {
            const saldo =
              (resultReceitas.totalReceitas || 0) -
              (resultDespesas.totalDespesas || 0);
            resolve({ saldo });
          }
        });
      }
    });
  });
});

ipcMain.handle("select-db-path", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  console.log("result", result);
  if (result.canceled) {
    return null;
    console.log("Operação cancelada");
  } else {
    return result.filePaths[0];
    console.log(result.filePaths[0]);
  }
});

// Função para obter uma despesa específica
function obterDespesa(id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM despesas WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// IPC Handler para obter uma despesa específica
ipcMain.handle("get-despesa", async (event, id) => {
  return obterDespesa(id);
});

// Função para atualizar o limite do cartão
function atualizarLimiteCartao(cartao_id, valor) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE cartoes SET limite = limite + ? WHERE id = ?`;
    db.run(sql, [valor, cartao_id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

// IPC Handler para atualizar o limite do cartão
ipcMain.handle("update-limite-cartao", async (event, { id, valor }) => {
  return atualizarLimiteCartao(id, valor);
});

// Função para obter o histórico de despesas pagas
function obterHistoricoDespesas() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM historico_despesas`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Função para obter o histórico de Receiats recebidas
function obterHistoricoReceitas() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM historico_receitas`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// IPC Handler para obter o histórico de despesas pagas
ipcMain.handle("get-historico-despesas", async () => {
  return obterHistoricoDespesas();
});

// IPC Handler para obter o histórico de Receitas recebidas
ipcMain.handle("get-historico-Receiatas", async () => {
  return obterHistoricoReceitas();
});

// Função para obter todas as contas bancárias
function obterContasBancarias() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM contas_bancarias`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Função para obter todas as despesas
function obterDespesas() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM despesas`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Função para obter todas as receitas
function obterReceitas() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM receitas`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Função para obter dados do dashboard
async function obterDadosDashboard() {
  const despesas = await obterDespesas();
  const receitas = await obterReceitas();
  return { despesas, receitas };
}

// IPC Handler para obter todas as contas bancárias
ipcMain.handle("get-contas-bancarias", async () => {
  return obterContasBancarias();
});

// IPC Handler para obter dados do dashboard
ipcMain.handle("get-dashboard-data", async () => {
  return obterDadosDashboard();
});

// Função para exportar dados em JSON
function exportarDadosJSON() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM despesas UNION ALL SELECT * FROM receitas`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const json = JSON.stringify(rows, null, 2);
                resolve(json);
            }
        });
    });
}

// Função para exportar dados em CSV
function exportarDadosCSV() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM despesas UNION ALL SELECT * FROM receitas`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const csv = rows.map(row => Object.values(row).join(",")).join("\n");
                resolve(csv);
            }
        });
    });
}

// Função para exportar dados em SQL
function exportarDadosSQL() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM despesas UNION ALL SELECT * FROM receitas`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const sqlDump = rows.map(row => `INSERT INTO despesas VALUES (${Object.values(row).map(value => `'${value}'`).join(",")});`).join("\n");
                resolve(sqlDump);
            }
        });
    });
}

// Função para exportar todo o banco de dados em JSON
function exportarBancoDadosJSON() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT name FROM sqlite_master WHERE type='table'`;
    db.all(sql, [], (err, tables) => {
      if (err) {
        reject(err);
      } else {
        const data = {};
        let count = tables.length;
        tables.forEach(table => {
          db.all(`SELECT * FROM ${table.name}`, [], (err, rows) => {
            if (err) {
              reject(err);
            } else {
              data[table.name] = rows;
              count--;
              if (count === 0) {
                resolve(JSON.stringify(data, null, 2));
              }
            }
          });
        });
      }
    });
  });
}

// Função para exportar todo o banco de dados em CSV
function exportarBancoDadosCSV() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT name FROM sqlite_master WHERE type='table'`;
    db.all(sql, [], (err, tables) => {
      if (err) {
        reject(err);
      } else {
        let csv = '';
        let count = tables.length;
        tables.forEach(table => {
          db.all(`SELECT * FROM ${table.name}`, [], (err, rows) => {
            if (err) {
              reject(err);
            } else {
              csv += `\n\nTable: ${table.name}\n`;
              csv += rows.map(row => Object.values(row).join(",")).join("\n");
              count--;
              if (count === 0) {
                resolve(csv);
              }
            }
          });
        });
      }
    });
  });
}

// Função para exportar todo o banco de dados em SQL
function exportarBancoDadosSQL() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT name FROM sqlite_master WHERE type='table'`;
    db.all(sql, [], (err, tables) => {
      if (err) {
        reject(err);
      } else {
        let sqlDump = '';
        let count = tables.length;
        tables.forEach(table => {
          db.all(`SELECT * FROM ${table.name}`, [], (err, rows) => {
            if (err) {
              reject(err);
            } else {
              sqlDump += `\n\n-- Table: ${table.name}\n`;
              sqlDump += rows.map(row => `INSERT INTO ${table.name} VALUES (${Object.values(row).map(value => `'${value}'`).join(",")});`).join("\n");
              count--;
              if (count === 0) {
                resolve(sqlDump);
              }
            }
          });
        });
      }
    });
  });
}

// IPC Handlers para exportação de dados
ipcMain.handle("exportar-dados", async (event, formato) => {
    let dados;
    switch (formato) {
        case "json":
            dados = await exportarBancoDadosJSON();
            break;
        case "csv":
            dados = await exportarBancoDadosCSV();
            break;
        case "sql":
            dados = await exportarBancoDadosSQL();
            break;
        default:
            throw new Error("Formato de exportação inválido");
    }

    const { filePath } = await dialog.showSaveDialog({
        title: "Salvar Dados Exportados",
        defaultPath: `banco_dados.${formato}`,
        buttonLabel: "Salvar",
        filters: [
            { name: "Arquivos", extensions: [formato] }
        ]
    });

    if (filePath) {
        fs.writeFileSync(filePath, dados);
        return { status: "success", message: "Dados exportados com sucesso!" };
    } else {
        return { status: "canceled", message: "Exportação cancelada pelo usuário." };
    }
});

// Função para importar dados em JSON
function importarDadosJSON(filePath) {
  return new Promise((resolve, reject) => {
    const json = fs.readFileSync(filePath, 'utf8');
    const dados = JSON.parse(json);
    const sqls = [];

    // Verificar a estrutura dos dados e criar as instruções SQL apropriadas
    for (const tabela in dados) {
      if (dados.hasOwnProperty(tabela)) {
        dados[tabela].forEach(row => {
          const colunas = Object.keys(row).join(", ");
          const valores = Object.values(row).map(value => `'${value}'`).join(", ");
          sqls.push(`INSERT INTO ${tabela} (${colunas}) VALUES (${valores});`);
        });
      }
    }

    db.serialize(() => {
      sqls.forEach(sql => {
        db.run(sql, (err) => {
          if (err) {
            reject(err);
          }
        });
      });
      resolve();
    });
  });
}

// Função para importar dados em CSV
function importarDadosCSV(filePath) {
  return new Promise((resolve, reject) => {
    const csv = fs.readFileSync(filePath, 'utf8');
    const linhas = csv.split("\n");
    const sqls = [];

    // Verificar a estrutura dos dados e criar as instruções SQL apropriadas
    let tabelaAtual = null;
    linhas.forEach(linha => {
      if (linha.startsWith("Table:")) {
        tabelaAtual = linha.split(":")[1].trim();
      } else if (tabelaAtual && linha.trim()) {
        const valores = linha.split(",").map(value => `'${value.trim()}'`).join(", ");
        sqls.push(`INSERT INTO ${tabelaAtual} VALUES (${valores});`);
      }
    });

    db.serialize(() => {
      sqls.forEach(sql => {
        db.run(sql, (err) => {
          if (err) {
            reject(err);
          }
        });
      });
      resolve();
    });
  });
}

// Função para importar dados em SQL
function importarDadosSQL(filePath) {
  return new Promise((resolve, reject) => {
    const sql = fs.readFileSync(filePath, 'utf8');
    const sqls = sql.split(";").filter(stmt => stmt.trim());

    db.serialize(() => {
      sqls.forEach(stmt => {
        db.run(stmt, (err) => {
          if (err) {
            reject(err);
          }
        });
      });
      resolve();
    });
  });
}

// IPC Handlers para importação de dados
ipcMain.handle("importar-dados", async (event, formato) => {
  const { filePaths } = await dialog.showOpenDialog({
      title: "Selecionar Arquivo para Importação",
      buttonLabel: "Importar",
      filters: [
          { name: "Arquivos", extensions: [formato] }
      ],
      properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
      const filePath = filePaths[0];
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
              throw new Error("Formato de importação inválido");
      }
      return { status: "success", message: "Dados importados com sucesso!" };
  } else {
      return { status: "canceled", message: "Importação cancelada pelo usuário." };
  }
});
async function selecionarFormato() {
  const { response } = await dialog.showMessageBox({
      type: 'question',
      buttons: ['JSON', 'CSV', 'SQL', 'Cancelar'],
      title: 'Selecionar Formato',
      message: 'Escolha o formato de exportação/importação:',
      cancelId: 3
  });

  switch (response) {
      case 0:
          return 'json';
      case 1:
          return 'csv';
      case 2:
          return 'sql';
      default:
          return null;
  }
}

// IPC Handler para selecionar formato
ipcMain.handle("selecionar-formato", async () => {
  return selecionarFormato();
});


// sessão de inovestimentos

ipcMain.handle('delete-investment', (event, id) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare("DELETE FROM investimentos WHERE id = ?");
    stmt.run(id, function (err) {
      if (err) {
        console.error("Erro ao excluir investimento:", err);
        reject(err);
      } else {
        console.log(`Investimento com ID ${id} excluído`);
        resolve(true); // Confirma que o investimento foi excluído
      }
    });
    stmt.finalize();
  });
});


// Manipulador para adicionar um investimento
ipcMain.handle("add-investment", async (event, investment) => {
  const { nome_ativo, quantidade, valor_investido, data_aquisicao, tipo_investimento, conta_origem, observacoes } = investment;

  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO investimentos (nome_ativo, quantidade, valor_investido, data_aquisicao, tipo_investimento, conta_origem, observacoes)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [nome_ativo, quantidade, valor_investido, data_aquisicao, tipo_investimento, conta_origem, observacoes], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
});

// Manipulador para obter os investimentos
ipcMain.handle("get-investments", async () => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM investimentos";
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows); // Retorna o array de investimentos
      }
    });
  });
});

// Função para marcar receita como recebida e mover para o histórico
ipcMain.handle("mark-receita-as-received", async (event, id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM receitas WHERE id = ?`;
    db.get(sql, [id], (err, receita) => {
      if (err) {
        reject(err);
      } else {
        const insertSql = `INSERT INTO historico_receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia, data_recebimento) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const deleteSql = `DELETE FROM receitas WHERE id = ?`;
        const data_recebimento = new Date().toISOString().split("T")[0];

        db.run(
          insertSql,
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
            data_recebimento,
          ],
          function (err) {
            if (err) {
              reject(err);
            } else {
              db.run(deleteSql, [id], function (err) {
                if (err) {
                  reject(err);
                } else {
                  resolve({ changes: this.changes });
                }
              });
            }
          }
        );
      }
    });
  });
});

// Funções para manipular reservas de emergência
function obterReservas() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM reservas`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function adicionarReserva(reserva) {
  return new Promise((resolve, reject) => {
    const { descricao, valor, data } = reserva;
    const sql = `INSERT INTO reservas (descricao, valor, data) VALUES (?, ?, ?)`;
    db.run(sql, [descricao, valor, data], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
}

function deletarReserva(id) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM reservas WHERE id = ?`;
    db.run(sql, [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

function atualizarReserva(reserva) {
  return new Promise((resolve, reject) => {
    const { id, descricao, valor, data } = reserva;
    const sql = `UPDATE reservas SET descricao = ?, valor = ?, data = ? WHERE id = ?`;
    db.run(sql, [descricao, valor, data, id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

// IPC Handlers para reservas de emergência
ipcMain.handle("get-reservas", async () => {
  return obterReservas();
});

ipcMain.handle("add-reserva", async (event, reserva) => {
  return adicionarReserva(reserva);
});

ipcMain.handle("delete-reserva", async (event, id) => {
  return deletarReserva(id);
});

ipcMain.handle("update-reserva", async (event, reserva) => {
  return atualizarReserva(reserva);
});

// Funções para manipular o objetivo de poupança
function obterObjetivo() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM objetivo`;
    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function definirObjetivo(objetivo) {
  return new Promise((resolve, reject) => {
    const { valor } = objetivo;
    const sql = `INSERT INTO objetivo (id, valor) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET valor = excluded.valor`;
    db.run(sql, [valor], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
}

// IPC Handlers para o objetivo de poupança
ipcMain.handle("get-objetivo", async () => {
  return obterObjetivo();
});

ipcMain.handle("set-objetivo", async (event, objetivo) => {
  return definirObjetivo(objetivo);
});