document.addEventListener("DOMContentLoaded", () => {
  const cadastroVendaForm = document.getElementById("cadastroVenda");
  const tabelaComissoes = document.getElementById("tabelaComissoes");

  // Função para carregar comissões pendentes
  async function carregarComissoes() {
    try {
      const response = await fetch("/api/comissoes");
      const comissoes = await response.json();
      tabelaComissoes.innerHTML = "";

      comissoes.forEach((comissao) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="p-2">${comissao.nf}</td>
          <td>${comissao.pedidoNectar}</td>
          <td>${comissao.notaNectar}</td>
          <td>R$ ${comissao.valorVenda.toFixed(2)}</td>
          <td>${comissao.dataVenda}</td>
          <td>R$ ${(comissao.valorVenda * 0.025).toFixed(2)}</td>
          <td>
            <button class="bg-red-500 text-white p-1 rounded excluir-btn" data-id="${comissao.id}">Excluir</button>
            <button class="bg-green-500 text-white p-1 rounded recebido-btn" data-id="${comissao.id}">Recebido</button>
          </td>
        `;
        tabelaComissoes.appendChild(tr);
      });

      adicionarEventosBotoes();
    } catch (error) {
      console.error("Erro ao carregar comissões:", error);
    }
  }

  // Função para adicionar eventos aos botões
  function adicionarEventosBotoes() {
    document.querySelectorAll(".excluir-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const id = event.target.dataset.id;
        try {
          await fetch(`/api/comissoes/${id}`, { method: "DELETE" });
          carregarComissoes();
        } catch (error) {
          console.error("Erro ao excluir comissão:", error);
        }
      });
    });

    document.querySelectorAll(".recebido-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const id = event.target.dataset.id;
        try {
          await fetch(`/api/comissoes/${id}/recebido`, { method: "PUT" });
          carregarComissoes();
        } catch (error) {
          console.error("Erro ao marcar comissão como recebida:", error);
        }
      });
    });
  }

  // Evento de envio do formulário de cadastro
  cadastroVendaForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const novaVenda = {
      nf: document.getElementById("nf").value,
      pedidoNectar: document.getElementById("pedidoNectar").value,
      notaNectar: document.getElementById("notaNectar").value,
      valorVenda: parseFloat(document.getElementById("valorVenda").value),
      dataVenda: document.getElementById("dataVenda").value,
    };

    try {
      await fetch("/api/comissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaVenda),
      });
      cadastroVendaForm.reset();
      carregarComissoes();
    } catch (error) {
      console.error("Erro ao cadastrar venda:", error);
    }
  });

  // Carregar comissões ao iniciar
  carregarComissoes();
});
