document.addEventListener('DOMContentLoaded', () => {
    loadReservas();
    const exportarButton = document.querySelector("#exportar");
    const reserveTable = document.querySelector("#reserveTable");
    const reservasList = document.getElementById('reservas-list');
    const addReservaForm = document.getElementById('add-reserva-form');
    const descricaoInput = document.getElementById('descricao');
    const valorInput = document.getElementById('valor');
    const dataInput = document.getElementById('data');
    const objetivoInput = document.getElementById('objetivo');
    const setObjetivoForm = document.getElementById('set-objetivo-form');
    const progressoBar = document.getElementById('progresso-bar');
    const simulacaoForm = document.getElementById('simulacao-form');
    const taxaInput = document.getElementById('taxa');
    const periodoInput = document.getElementById('periodo');
    const resultadoSimulacao = document.getElementById('resultado-simulacao');
    const notificacao = document.getElementById('notificacao');
    const resumoTotal = document.getElementById('resumo-total');
    const resumoObjetivo = document.getElementById('resumo-objetivo');
    const exportarBtn = document.getElementById('exportar-btn');
    const importarBtn = document.getElementById('importar-btn');
    const relatorioBtn = document.getElementById('relatorio-btn');
    const reservasTable = document.querySelector("#reservasTable");
    const reservaForm = document.querySelector("#reservaForm");
    

    async function gerarRelatorioPDF(reservas) {
        const { PDFDocument, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 400]);
        const { width, height } = page.getSize();
        const fontSize = 12;

        page.drawText('Relatório de Reservas', {
            x: 50,
            y: height - 50,
            size: 18,
            color: rgb(0, 0, 0.8),
        });

        reservas.forEach((reserva, index) => {
            const y = height - 80 - index * 20;
            page.drawText(`${reserva.descricao} - R$ ${reserva.valor} - ${reserva.data}`, {
                x: 50,
                y,
                size: fontSize,
                color: rgb(0, 0, 0),
            });
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'relatorio_reservas.pdf';
        a.click();
        URL.revokeObjectURL(url);
    }

    async function loadReservas() {
        try {
            const response = await fetch('/api/reservas');
            if (!response.ok) throw new Error('Erro ao carregar reservas');
            const reservas = await response.json();

            const reservasTableBody = document.querySelector('#reservasTableBody');
            if (!reservasTableBody) {
                console.error("Elemento 'reservasTableBody' não encontrado.");
                return;
            }

            reservasTableBody.innerHTML = ''; // Limpar tabela
            let totalReservas = 0;

            reservas.forEach(reserva => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${reserva.descricao}</td>
                    <td>R$ ${reserva.valor.toFixed(2)}</td>
                    <td>${reserva.data}</td>
                    <td>
                        <button class="editar-reserva bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg" data-id="${reserva.id}">Editar</button>
                        <button class="excluir-reserva bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg" data-id="${reserva.id}">Excluir</button>
                    </td>
                `;
                reservasTableBody.appendChild(tr);
                totalReservas += reserva.valor;
            });

            updateProgresso(totalReservas);
            addEventListeners(); // Adicionar eventos aos botões após renderizar a tabela
        } catch (error) {
            console.error('Erro ao carregar reservas:', error);
        }
    }

    async function updateProgresso(totalReservas) {
        try {
            const response = await fetch('/api/objetivo');
            if (!response.ok) throw new Error('Erro ao carregar objetivo');
            const objetivo = await response.json();
            if (objetivo) {
                const progresso = (totalReservas / objetivo.valor) * 100;
                progressoBar.style.width = `${progresso}%`;
                progressoBar.textContent = `${progresso.toFixed(2)}%`;
                resumoTotal.textContent = `Total Reservado: R$ ${totalReservas.toFixed(2)}`;
                resumoObjetivo.textContent = `Objetivo: R$ ${objetivo.valor.toFixed(2)}`;
                if (totalReservas >= objetivo.valor) {
                    showMessage('Parabéns! Você atingiu seu objetivo de poupança!', 'success');
                }
            }
        } catch (error) {
            console.error('Erro ao carregar objetivo:', error);
        }
    }

    async function addReserva(reserva) {
        const response = await fetch('/api/reservas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reserva),
        });
        if (!response.ok) throw new Error('Erro ao adicionar reserva');
    }

    async function updateReserva(reserva) {
        const response = await fetch(`/api/reservas/${reserva.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reserva),
        });
        if (!response.ok) throw new Error('Erro ao atualizar reserva');
    }

    async function deleteReserva(id) {
        const response = await fetch(`/api/reservas/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao excluir reserva');
    }

    async function setObjetivo(objetivo) {
        const response = await fetch('/api/objetivo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objetivo),
        });
        if (!response.ok) throw new Error('Erro ao definir objetivo');
    }

    function calcularSimulacao(valorInicial, taxa, periodo) {
        const taxaMensal = taxa / 100 / 12;
        let valorFinal = valorInicial;
        for (let i = 0; i < periodo; i++) {
            valorFinal += valorFinal * taxaMensal;
        }
        return valorFinal.toFixed(2);
    }

    function showMessage(message, type) {
        let toastContainer = document.getElementById("toast-container");
        if (!toastContainer) {
            toastContainer = document.createElement("div");
            toastContainer.id = "toast-container";
            toastContainer.style.position = "fixed";
            toastContainer.style.top = "20px";
            toastContainer.style.right = "20px";
            toastContainer.style.zIndex = "9999";
            toastContainer.style.display = "flex";
            toastContainer.style.flexDirection = "column";
            toastContainer.style.gap = "10px";
            toastContainer.style.alignItems = "center"; // Centralizar mensagens
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement("div");
        toast.className = `toast-message alert alert-${type}`;
        toast.textContent = message;
        toast.style.padding = "15px 20px";
        toast.style.borderRadius = "8px";
        toast.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
        toast.style.color = "#fff";
        toast.style.fontWeight = "bold";
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-20px)";
        toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        toast.style.display = "flex";
        toast.style.alignItems = "center";
        toast.style.justifyContent = "center";
      
        const colors = {
          success: "#4CAF50",
          error: "#F44336",
          warning: "#FFC107",
          info: "#2196F3"
        };
        toast.style.backgroundColor = colors[type] || "#333";
        
        toastContainer.appendChild(toast);
      
        setTimeout(() => {
          toast.style.opacity = "1";
          toast.style.transform = "translateY(0)";
        }, 100);
        
        setTimeout(() => {
          toast.style.opacity = "0";
          toast.style.transform = "translateY(-20px)";
          setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function addEventListeners() {
        // Adicionar evento para os botões de editar
        document.querySelectorAll('.editar-reserva').forEach(button => {
            button.addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                try {
                    const response = await fetch(`/api/reservas/${id}`);
                    if (!response.ok) throw new Error('Erro ao carregar reserva');
                    const reserva = await response.json();
                    descricaoInput.value = reserva.descricao;
                    valorInput.value = reserva.valor;
                    dataInput.value = reserva.data;
                    addReservaForm.dataset.id = id; // Armazenar o ID no formulário
                } catch (error) {
                    console.error('Erro ao carregar reserva:', error);
                }
            });
        });

        // Adicionar evento para os botões de excluir
        document.querySelectorAll('.excluir-reserva').forEach(button => {
            button.addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                try {
                    await deleteReserva(id);
                    loadReservas(); // Recarregar a tabela após excluir
                    showMessage('Reserva excluída com sucesso!', 'success');
                } catch (error) {
                    console.error('Erro ao excluir reserva:', error);
                }
            });
        });

        exportarBtn.addEventListener('click', () => {
            window.controle.selecionarFormato().then(formato => {
                if (formato) {
                    window.controle.exportarDados(formato).then(response => {
                        showMessage(response.message, response.status === 'success' ? 'success' : 'error');
                    });
                }
            });
        });

        importarBtn.addEventListener('click', () => {
            window.controle.selecionarFormato().then(formato => {
                if (formato) {
                    window.controle.importarDados(formato).then(response => {
                        showMessage(response.message, response.status === 'success' ? 'success' : 'error');
                        loadReservas();
                    });
                }
            });
        });

        relatorioBtn.addEventListener('click', () => {
            window.controle.getReservas().then(reservas => {
                gerarRelatorioPDF(reservas);
                showMessage('Relatório gerado com sucesso!', 'success');
            });
        });
    }

    addReservaForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const reserva = {
            descricao: descricaoInput.value,
            valor: parseFloat(valorInput.value),
            data: dataInput.value,
        };
        const id = addReservaForm.dataset.id;
        try {
            if (id) {
                reserva.id = id;
                await updateReserva(reserva);
                showMessage('Reserva atualizada com sucesso!', 'success');
            } else {
                await addReserva(reserva);
                showMessage('Reserva adicionada com sucesso!', 'success');
            }
            loadReservas();
            addReservaForm.reset();
            addReservaForm.removeAttribute('data-id');
        } catch (error) {
            console.error('Erro ao salvar reserva:', error);
        }
    });

    setObjetivoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const objetivo = { valor: parseFloat(objetivoInput.value) };
        try {
            await setObjetivo(objetivo);
            loadReservas();
            setObjetivoForm.reset();
            showMessage('Objetivo definido com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao definir objetivo:', error);
        }
    });

    simulacaoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const taxa = parseFloat(taxaInput.value);
        const periodo = parseInt(periodoInput.value);
        try {
            const response = await fetch('/api/reservas');
            if (!response.ok) throw new Error('Erro ao carregar reservas');
            const reservas = await response.json();
            let totalReservas = reservas.reduce((total, reserva) => total + reserva.valor, 0);
            const valorFinal = calcularSimulacao(totalReservas, taxa, periodo);
            resultadoSimulacao.textContent = `Valor após ${periodo} meses: R$ ${valorFinal}`;
        } catch (error) {
            console.error('Erro ao calcular simulação:', error);
        }
    });

    reservaForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const descricao = document.querySelector("#descricao").value;
        const valor = document.querySelector("#valor").value;
        const data = document.querySelector("#data").value;

        if (descricao && valor && data) {
            const novaLinha = `
                <tr>
                    <td>${descricao}</td>
                    <td>${valor}</td>
                    <td>${data}</td>
                </tr>
            `;
            reservasTable.querySelector("tbody").insertAdjacentHTML("beforeend", novaLinha);
            reservaForm.reset();
        }
    });

    exportarButton.addEventListener("click", () => {
        exportarPDF();
    });

    function exportarPDF() {
        console.log(totalGasto);
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("Histórico de Despesas Pagas", 10, 10);
        doc.autoTable({
          html: "#reserveTable",
          didDrawPage: (data) => {
            // Adicionar o total gasto no final da página
            const pageHeight = doc.internal.pageSize.height;
            doc.text(`Total Gasto: R$ ${totalGasto.toFixed(2)}`, 10, pageHeight - 10);
          },
        });
        doc.save("historico_despesas.pdf");
      }

    loadReservas();
});