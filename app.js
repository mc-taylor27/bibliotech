// --- ESTADO GLOBAL DA APLICAÇÃO ---
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || []; 
let emprestimos = JSON.parse(localStorage.getItem('emprestimos')) || []; 
let livroSelecionado = null;

console.log(usuarios);

// Descobre em qual página o usuário está navegando atualmente
const paginaAtual = window.location.pathname.split("/").pop();

// --- MAPEAMENTO ELEMENTOS DO DOM (Condicionais para evitar erros de null) ---
const subtituloHeader = document.getElementById('subtitulo-header');
const btnLogout = document.getElementById('btn-logout');

const formLogin = document.getElementById('form-login');
const formCadastro = document.getElementById('form-cadastro');

const inputBusca = document.getElementById('input-busca');
const btnBuscar = document.getElementById('btn-buscar');
const loadingUI = document.getElementById('loading');
const resultadoBuscaUI = document.getElementById('resultado-busca');
const btnFinalizarEmprestimo = document.getElementById('btn-finalizar-emprestimo');
const listaEmprestimosUI = document.getElementById('lista-emprestimos');
const listaEmprestimosLeitorUI = document.getElementById('lista-emprestimos-leitor');

// ================= CONTROLE DE SESSÃO E SEGURANÇA =================
function verificarSessao() {
    const logado = JSON.parse(sessionStorage.getItem('usuarioLogado'));

    // Se não estiver logado e tentar acessar leitor ou admin, volta para o index
    if (!logado && (paginaAtual === 'leitor.html' || paginaAtual === 'admin.html')) {
        window.location.href = 'index.html';
        return;
    }

    if (logado) {
        if (subtituloHeader) subtituloHeader.innerText = `Olá, ${logado.nome}!`;

        // Bloqueia leitor de entrar na página do admin e vice-versa
        if (logado.tipo === 'admin' && paginaAtual === 'leitor.html') {
            window.location.href = 'admin.html';
        } else if (logado.tipo === 'cliente' && paginaAtual === 'admin.html') {
            window.location.href = 'leitor.html';
        }
    }
}

// Evento de Logout
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = 'index.html';
    });
}

// ================= FASE A: LOGIN & CADASTRO =================

if (formCadastro) {
    formCadastro.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('cad-nome').value.trim();
        const email = document.getElementById('cad-email').value.trim();
        const senha = document.getElementById('cad-senha').value.trim();

        if (usuarios.some(u => u.email === email) || email === 'admin') {
            alert('Este e-mail já está em uso no sistema!');
            return;
        }

        const novoUsuario = { nome, email, senha, tipo: 'cliente' };
        usuarios.push(novoUsuario);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));

        alert("Sucesso!"); 
        formCadastro.reset();
        window.location.href = 'index.html'; 
    });
}

if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('login-email').value.trim();
        const senhaInput = document.getElementById('login-senha').value.trim();

        // 1. Administrador Fixo
        if (emailInput === 'admin' && senhaInput === 'admin') { // Adicionada trava simples de senha pro admin
            const cracha = { nome: 'Administrador', tipo: 'admin' };
            sessionStorage.setItem('usuarioLogado', JSON.stringify(cracha));
            window.location.href = 'admin.html';
            return;
        }

        // 2. Leitores
        const usuarioEncontrado = usuarios.find(u => u.email === emailInput && u.senha === senhaInput);

        if (usuarioEncontrado) {
            const cracha = { nome: usuarioEncontrado.nome, tipo: 'cliente' };
            sessionStorage.setItem('usuarioLogado', JSON.stringify(cracha));
            window.location.href = 'leitor.html';
        } else {
            alert('E-mail ou senha incorretos! Tente novamente.');
        }
    });
}

// ================= FASE B: SISTEMA DO LEITOR (BUSCA & LOCAÇÃO) =================

if (paginaAtual === 'leitor.html') {
    
    btnBuscar.addEventListener('click', async () => {
        const termo = inputBusca.value.trim();
        if (!termo) {
            alert('Digite o nome de um livro para buscar!');
            return;
        }

        loadingUI.classList.remove('hidden'); 
        resultadoBuscaUI.innerHTML = '';

        try {
            const livro = await buscarLivroNaAPI(termo); 
            loadingUI.classList.add('hidden'); 

            if (!livro) { 
                resultadoBuscaUI.innerHTML = '<p style="color:red; margin-top:10px;">Nenhum livro encontrado com esse título.</p>';
                return;
            }

            resultadoBuscaUI.innerHTML = `
                <div class="card-livro">
                    <img src="${livro.capa}" alt="Capa do livro">
                    <div class="info-livro">
                        <div>
                            <h4>${livro.titulo}</h4>
                            <p><small>Autor: ${livro.autor}</small></p>
                        </div>
                        <button id="btn-selecionar-livro">Selecionar Livro</button>
                    </div>
                </div>
            `; 

            document.getElementById('btn-selecionar-livro').addEventListener('click', () => {
                livroSelecionado = livro; 
                document.getElementById('livro-selecionado-titulo').innerText = livro.titulo;
                btnFinalizarEmprestimo.disabled = false;
            });

        } catch (erro) { 
            loadingUI.classList.add('hidden'); 
            resultadoBuscaUI.innerHTML = '<p style="color:red; margin-top:10px;">Erro ao conectar com a API de livros.</p>';
        }
    });

    btnFinalizarEmprestimo.addEventListener('click', () => {
        if (!livroSelecionado) return;

        const logado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
        const hoje = new Date();
        const dataDevolucao = new Date();
        dataDevolucao.setDate(hoje.getDate() + 7); 

        const novoEmprestimo = {
            id: Date.now(),
            clienteNome: logado.nome, 
            livroTitulo: livroSelecionado.titulo, 
            livroCapa: livroSelecionado.capa, 
            devolucao: dataDevolucao.toLocaleDateString('pt-BR')
        };

        emprestimos.push(novoEmprestimo);
        localStorage.setItem('emprestimos', JSON.stringify(emprestimos)); 

        alert(`Sucesso! Você pegou o livro "${livroSelecionado.titulo}" emprestado.`);

        // Reset do formulário e recarrega a lista do leitor
        livroSelecionado = null;
        document.getElementById('livro-selecionado-titulo').innerText = 'Nenhum';
        resultadoBuscaUI.innerHTML = '';
        inputBusca.value = '';
        btnFinalizarEmprestimo.disabled = true;
        
        renderizarEmprestimosLeitor();
    });
}

function renderizarEmprestimosLeitor() {
    if (!listaEmprestimosLeitorUI) return;
    listaEmprestimosLeitorUI.innerHTML = '';
    
    const logado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    // Filtra para exibir apenas os empréstimos correspondentes ao usuário ativo
    const meusEmprestimos = emprestimos.filter(emp => emp.clienteNome === logado.nome);

    if (meusEmprestimos.length === 0) {
        listaEmprestimosLeitorUI.innerHTML = '<p style="text-align:center; color:#64748b; font-style:italic; padding:10px;">Você não possui nenhum empréstimo ativo.</p>';
        return;
    }

    meusEmprestimos.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'card-emprestimo';
        card.innerHTML = `
            <img src="${emp.livroCapa}" alt="Capa">
            <div>
                <h4>${emp.livroTitulo}</h4>
                <p><small style="color: #6b21a8; font-weight: bold;">Devolução: ${emp.devolucao}</small></p>
            </div>
        `; 
        listaEmprestimosLeitorUI.appendChild(card);
    });
}

// ================= FASE C: VISÃO DO ADMINISTRADOR =================
function renderizarEmprestimosAdmin() {
    if (!listaEmprestimosUI) return;
    listaEmprestimosUI.innerHTML = '';
    
    if (emprestimos.length === 0) {
        listaEmprestimosUI.innerHTML = '<p style="text-align:center; color:#64748b; font-style:italic; padding:10px;">Nenhum empréstimo ativo no momento.</p>';
        return;
    }

    emprestimos.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'card-emprestimo';
        card.innerHTML = `
            <img src="${emp.livroCapa}" alt="Capa">
            <div>
                <h4>${emp.livroTitulo}</h4>
                <p><small>Quem pegou: <strong>${emp.clienteNome}</strong></small></p>
                <p><small style="color: #6b21a8; font-weight: bold;">Devolução: ${emp.devolucao}</small></p>
            </div>
        `; 
        listaEmprestimosUI.appendChild(card);
    });
}

// --- INICIALIZAÇÃO DA PÁGINA ---
verificarSessao();
if (paginaAtual === 'leitor.html') renderizarEmprestimosLeitor();
if (paginaAtual === 'admin.html') renderizarEmprestimosAdmin();