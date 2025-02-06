let totalGasto = 0;
      document.addEventListener('DOMContentLoaded', async () => {
          const cartoes = await window.controle.getCartoes();
          const cartaoSelect = document.getElementById('cartao');
          cartoes.forEach(cartao => {
              const option = document.createElement('option');
              option.value = cartao.id;
              option.textContent = `${cartao.nome} - ${cartao.banco}`;
              cartaoSelect.appendChild(option);
          });
          document.getElementById('exportar').addEventListener('click', () => {
                exportarPDF();
          });
  
          document.getElementById('forma_pagamento').addEventListener('change', (event) => {
              const cartaoCreditoOptions = document.getElementById('cartaoCreditoOptions');
              if (event.target.value === 'Cartão de Crédito') {
                  cartaoCreditoOptions.classList.remove('hidden');
              } else {
                  cartaoCreditoOptions.classList.add('hidden');
              }
          });
  
          document.getElementById('numero_parcelas').addEventListener('input', (event) => {
              const valor = parseFloat(document.getElementById('valor').value);
              const numeroParcelas = parseInt(event.target.value);
              const valorParcela = valor / numeroParcelas;
              document.getElementById('valor_parcela').value = valorParcela.toFixed(2);
          });
  
          document.getElementById('despesaForm').addEventListener('submit', async (event) => {
              event.preventDefault();
              const estabelecimento = document.getElementById('estabelecimento').value;
              const data = document.getElementById('data').value;
              const valor = parseFloat(document.getElementById('valor').value);
              const formaPagamento = document.getElementById('forma_pagamento').value;
              const numeroParcelas = formaPagamento === 'Cartão de Crédito' ? parseInt(document.getElementById('numero_parcelas').value) : 1;
              const cartaoId = formaPagamento === 'Cartão de Crédito' ? parseInt(document.getElementById('cartao').value) : null;
  
              const despesa = {
                  estabelecimento,
                  data,
                  valor,
                  forma_pagamento: formaPagamento,
                  numero_parcelas: numeroParcelas,
                  cartao_id: cartaoId
              };
  
              await window.controle.invoke('add-despesa', despesa);
              alert('Despesa adicionada com sucesso!');
              loadDespesas();
          });
  
          loadDespesas();
      });
  
      async function loadDespesas() {
          const despesas = await window.controle.invoke('get-despesas');
          const tableBody = document.querySelector("#despesasTable tbody");
          tableBody.innerHTML = ""; // Limpar tabela
          totalGasto = 0;
  
          despesas.forEach((despesa) => {
              const row = document.createElement("tr");
              row.innerHTML = `
                  <td>${despesa.estabelecimento}</td>
                  <td>${despesa.data}</td>
                  <td>R$ ${despesa.valor}</td>
                  <td>${despesa.forma_pagamento}</td>
                  <td>${despesa.numero_parcelas}</td>
                  <td>${despesa.parcelas_restantes}</td>
                  <td>R$ ${despesa.valor_parcela}</td>
                  <td>${despesa.cartao_id}</td>
                  <td>
                      <button class="btn btn-success btn-sm" onclick="payDespesa(${despesa.id})">Pagar</button>
                      <button class="btn btn-danger btn-sm" onclick="deleteDespesa(${despesa.id})">Excluir</button>
                  </td>
              `;
              tableBody.appendChild(row); // Adicionar linha à tabela
              totalGasto += despesa.valor;
          });
      }
  
      async function loadCartoes() {
          const cartoes = await window.controle.invoke('get-cartoes');
          const cartaoSelect = document.getElementById('cartao');
          cartaoSelect.innerHTML = ""; // Limpar opções
  
          cartoes.forEach((cartao) => {
              const option = document.createElement("option");
              option.value = cartao.id;
              option.textContent = `${cartao.nome} - Limite: R$${cartao.limite}`;
              cartaoSelect.appendChild(option); // Adicionar opção ao select
          });
      }
  
      async function payDespesa(id) {
          if (confirm('Tem certeza que deseja pagar esta despesa?')) {
              await window.controle.invoke('pay-despesa', id);
              loadDespesas(); // Atualizar a lista de despesas
          }
      }
  
      async function deleteDespesa(id) {
          if (confirm('Tem certeza que deseja excluir esta despesa?')) {
              await window.controle.invoke('delete-despesa', id);
              loadDespesas(); // Atualizar a lista de despesas
          }
      }
      function exportarPDF() {
            console.log(totalGasto);
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.text("Relatorio de Despesas", 10, 10);
            doc.autoTable({
                html: '#despesasTable',
                didDrawPage: (data) => {
                    // Adicionar o total gasto no final da página
                    const pageHeight = doc.internal.pageSize.height;
                    doc.text(`Total Gasto: R$ ${totalGasto.toFixed(2)}`, 10, pageHeight - 10);
                }
            });
            doc.save('Relatorio de despesas.pdf');
        }