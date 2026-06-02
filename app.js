// --- ESTADO GLOBAL DA APLICAÇÃO ---
let clientes = JSON.parse(localStorage.getItem('clientes')) || []; 
let emprestimos = JSON.parse(localStorage.getItem('emprestimos')) || []; 

let clienteSelecionado = null;
let livroSelecionado = null;

// --- ELEMENTOS DO DOM ---
const formCliente = document.getElementById('form-cliente');
const listaClientesUI = document.getElementById('lista-clientes');
const inputBusca = document.getElementById('input-busca');
const btnBuscar = document.getElementById('btn-buscar');
const loadingUI = document.getElementById('loading');
const resultadoBuscaUI = document.getElementById('resultado-busca');
const btnFinalizarEmprestimo = document.getElementById('btn-finalizar-emprestimo');
const listaEmprestimosUI = document.getElementById('lista-emprestimos');

// --- 1. GESTÃO DE CLIENTES ---
formCliente.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome-cliente').value.trim();
    const cpf = document.getElementById('cpf-cliente').value.trim();
    const email = document.getElementById('email-cliente').value.trim();

    // Tratamento de Erro / Validação simples
    if (!nome || !cpf || !email) { 
        alert('Por favor, preencha todos os campos do cliente!');
        return;
    }

    const novoCliente = { id: Date.now(), nome, cpf, email };
    clientes.push(novoCliente);
    
    localStorage.setItem('clientes', JSON.stringify(clientes)); 
    formCliente.reset();
    renderizarClientes();
});

function renderizarClientes() {
    listaClientesUI.innerHTML = '';
    clientes.forEach(cliente => {
        const li = document.createElement('li');
        li.className = 'item-cliente';
        if (clienteSelecionado && clienteSelecionado.id === cliente.id) {
            li.classList.add('selecionado');
        }
        li.innerHTML = `<strong>${cliente.nome}</strong><br><small>CPF: ${cliente.cpf}</small>`;
        
        // Evento de seleção para empréstimo
        li.addEventListener('click', () => {
            clienteSelecionado = cliente;
            document.getElementById('cliente-selecionado-nome').innerText = cliente.nome;
            renderizarClientes(); // Atualiza classe visual de selecionado
            verificarBotaoEmprestimo();
        });
        
        listaClientesUI.appendChild(li);
    });
}

// --- 2. BUSCA INTELIGENTE DE LIVROS ---
btnBuscar.addEventListener('click', async () => {
    const termo = inputBusca.value.trim();
    if (!termo) {
        alert('Digite o nome de um livro para buscar!');
        return;
    }

    // Feedback visual de Carregando...
    loadingUI.classList.remove('hidden'); 
    resultadoBuscaUI.innerHTML = '';

    try {
        const livro = await buscarLivroNaAPI(termo); 
        loadingUI.classList.add('hidden'); 

        if (!livro) { 
            resultadoBuscaUI.innerHTML = '<p style="color:red; margin-top:10px;">Nenhum livro encontrado com esse título.</p>';
            return;
        }

        // Renderiza card do livro encontrado
        resultadoBuscaUI.innerHTML = `
            <div class="card-livro">
                <img src="${livro.capa}" alt="Capa do livro">
                <div class="info-livro">
                    <div>
                        <h4>${livro.titulo}</h4>
                        <p><small>Autor: ${livro.autor}</small></p>
                    </div>
                    <button id="btn-selecionar-livro">Selecionar para Empréstimo</button>
                </div>
            </div>
        `; 

        // Evento ao clicar no botão interno do card
        document.getElementById('btn-selecionar-livro').addEventListener('click', () => {
            livroSelecionado = livro; 
            document.getElementById('livro-selecionado-titulo').innerText = livro.titulo;
            verificarBotaoEmprestimo();
        });

    } catch (erro) { 
        loadingUI.classList.add('hidden'); 
        resultadoBuscaUI.innerHTML = '<p style="color:red; margin-top:10px;">Erro ao conectar com o serviço de livros. Tente novamente.</p>';
    }
});

// --- 3. CONTROLE DE EMPRÉSTIMOS ---
function verificarBotaoEmprestimo() {
    // Só habilita o botão final se tiver ambos selecionados
    if (clienteSelecionado && livroSelecionado) {
        btnFinalizarEmprestimo.disabled = false;
    } else {
        btnFinalizerEmprestimo.disabled = true;
    }
}

btnFinalizarEmprestimo.addEventListener('click', () => {
    if (!clienteSelecionado || !livroSelecionado) return;

    // Calcular data de devolução (7 dias a partir de hoje)
    const hoje = new Date();
    const dataDevolucao = new Date();
    dataDevolucao.setDate(hoje.getDate() + 7); 

    const novoEmprestimo = {
        id: Date.now(),
        clienteNome: clienteSelecionado.nome, 
        livroTitulo: livroSelecionado.titulo, 
        livroCapa: livroSelecionado.capa, 
        devolucao: dataDevolucao.toLocaleDateString('pt-BR')
    };

    emprestimos.push(novoEmprestimo);
    localStorage.setItem('emprestimos', JSON.stringify(emprestimos)); 

    // Resetar seleções atuais
    clienteSelecionado = null;
    livroSelecionado = null;
    document.getElementById('cliente-selecionado-nome').innerText = 'Nenhum';
    document.getElementById('livro-selecionado-titulo').innerText = 'Nenhum';
    resultadoBuscaUI.innerHTML = '';
    inputBusca.value = '';
    
    btnFinalizarEmprestimo.disabled = true;

    renderizarClientes();
    renderizarEmprestimos();
});

function renderizarEmprestimos() {
    listaEmprestimosUI.innerHTML = '';
    
    if (emprestimos.length === 0) {
        listaEmprestimosUI.innerHTML = '<p><small>Nenhum empréstimo ativo no momento.</small></p>';
        return;
    }

    emprestimos.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'card-emprestimo';
        card.innerHTML = `
            <img src="${emp.livroCapa}" alt="Capa">
            <div>
                <h4>${emp.livroTitulo}</h4>
                <p><small>Leitor: <strong>${emp.clienteNome}</strong></small></p>
                <p><small style="color: var(--success)">Devolução: ${emp.devolucao}</small></p>
            </div>
        `; 
        listaEmprestimosUI.appendChild(card);
    });
}

// --- INICIALIZAÇÃO DA PÁGINA ---
renderizarClientes();
renderizarEmprestimos();