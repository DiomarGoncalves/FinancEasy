document.addEventListener('DOMContentLoaded', () => {
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

    function loadReservas() {
        window.controle.getReservas().then(reservas => {
            reservasList.innerHTML = '';
            let totalReservas = 0;
            reservas.forEach(reserva => {
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center bg-gray-800 p-4 rounded-lg';
                li.innerHTML = `
                    <span>${reserva.descricao} - R$ ${reserva.valor} - ${reserva.data}</span>
                    <div class="flex gap-2">
                        <button class="editar-reserva bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg" data-id="${reserva.id}">Editar</button>
                        <button class="excluir-reserva bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg" data-id="${reserva.id}">Excluir</button>
                    </div>
                `;
                reservasList.appendChild(li);
                totalReservas += reserva.valor;
            });
            updateProgresso(totalReservas);
            addEventListeners();
        });
    }

    function updateProgresso(totalReservas) {
        window.controle.getObjetivo().then(objetivo => {
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
        });
    }

    function calcularSimulacao(valorInicial, taxa, periodo) {
        const taxaMensal = taxa / 100 / 12;
        let valorFinal = valorInicial;
        for (let i = 0; i < periodo; i++) {
            valorFinal += valorFinal * taxaMensal;
        }
        return valorFinal.toFixed(2);
    }

    function showNotificacao(mensagem, tipo) {
        notificacao.textContent = mensagem;
        notificacao.className = `fixed top-4 right-4 p-4 rounded-lg ${tipo === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
        setTimeout(() => {
            notificacao.textContent = '';
            notificacao.className = '';
        }, 3000);
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
        document.querySelectorAll('.editar-reserva').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = event.target.dataset.id;
                window.controle.getReservas().then(reservas => {
                    const reserva = reservas.find(r => r.id == id);
                    descricaoInput.value = reserva.descricao;
                    valorInput.value = reserva.valor;
                    dataInput.value = reserva.data;
                    addReservaForm.dataset.id = id;
                });
            });
        });

        document.querySelectorAll('.excluir-reserva').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = event.target.dataset.id;
                window.controle.deleteReserva(id).then(() => {
                    loadReservas();
                    showMessage('Reserva excluída com sucesso!', 'success');
                });
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

    addReservaForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const reserva = {
            descricao: descricaoInput.value,
            valor: parseFloat(valorInput.value),
            data: dataInput.value
        };
        const id = addReservaForm.dataset.id;
        if (id) {
            reserva.id = id;
            window.controle.updateReserva(reserva).then(() => {
                loadReservas();
                addReservaForm.reset();
                addReservaForm.removeAttribute('data-id');
                showMessage('Reserva atualizada com sucesso!', 'success');
            });
        } else {
            window.controle.addReserva(reserva).then(() => {
                loadReservas();
                addReservaForm.reset();
                showMessage('Reserva adicionada com sucesso!', 'success');
            });
        }
    });

    setObjetivoForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const objetivo = {
            valor: parseFloat(objetivoInput.value)
        };
        window.controle.setObjetivo(objetivo).then(() => {
            loadReservas();
            setObjetivoForm.reset();
            showMessage('Objetivo definido com sucesso!', 'success');
        });
    });

    simulacaoForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const taxa = parseFloat(taxaInput.value);
        const periodo = parseInt(periodoInput.value);
        window.controle.getReservas().then(reservas => {
            let totalReservas = 0;
            reservas.forEach(reserva => {
                totalReservas += reserva.valor;
            });
            const valorFinal = calcularSimulacao(totalReservas, taxa, periodo);
            resultadoSimulacao.textContent = `Valor após ${periodo} meses: R$ ${valorFinal}`;
        });
    });

    loadReservas();
});
