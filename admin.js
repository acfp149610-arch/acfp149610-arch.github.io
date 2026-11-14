// ======================================
// CONFIGURAÇÃO DO SUPABASE
// ======================================

const SUPABASE_URL = "https://kghzycpuvlidoenqnhhb.supabase.co";

// COLOQUE AQUI SUA PUBLISHABLE KEY CORRETA
const SUPABASE_KEY = "sb_publishable_IntMzNdV-nhtxW8czMBijA_4yVRgbIp";

const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);


// ======================================
// ENTRAR SEM SENHA
// ======================================

async function entrar() {

    const email = document.getElementById("email").value.trim();
    const mensagem = document.getElementById("mensagem");

    if (!email) {
        mensagem.textContent = "Digite seu e-mail.";
        return;
    }

    mensagem.textContent = "Enviando link de acesso...";

    const { error } = await client.auth.signInWithOtp({
        email: email,
        options: {
            emailRedirectTo: "https://acfp149610-arch.github.io/admin.html"
        }
    });

    if (error) {
        mensagem.textContent = "Erro: " + error.message;
        console.error(error);
        return;
    }

    mensagem.textContent =
        "Link enviado! Confira seu e-mail e clique no link para acessar.";
}

window.entrar = entrar;


// ======================================
// VERIFICAR SE É ADMINISTRADOR
// ======================================

async function verificarSessao() {

    const { data, error } = await client.auth.getSession();

    if (error || !data.session) {
        return;
    }

    const usuario = data.session.user;

    const { data: admin, error: erroAdmin } = await client
        .from("admins")
        .select("user_id")
        .eq("user_id", usuario.id)
        .maybeSingle();

    if (erroAdmin) {
        console.error(erroAdmin);
        alert("Erro ao verificar administrador: " + erroAdmin.message);
        return;
    }

    if (!admin) {
        await client.auth.signOut();
        alert("Este e-mail não está autorizado como administrador.");
        return;
    }

    document.getElementById("login").style.display = "none";
    document.getElementById("painel").style.display = "block";

    carregarContratacoes();
}


// ======================================
// SAIR
// ======================================

async function sair() {

    await client.auth.signOut();

    document.getElementById("painel").style.display = "none";
    document.getElementById("login").style.display = "block";

    document.getElementById("mensagem").textContent =
        "Você saiu da área administrativa.";
}

window.sair = sair;


// ======================================
// CARREGAR CONTRATAÇÕES
// ======================================

async function carregarContratacoes() {

    const lista = document.getElementById("listaContratacoes");

    lista.innerHTML = "<p>Carregando contratações...</p>";

    const { data, error } = await client
        .from("contratacoes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        lista.innerHTML =
            "<p>Erro ao carregar: " + escapar(error.message) + "</p>";
        return;
    }

    document.getElementById("total").textContent = data.length;

    document.getElementById("pendentes").textContent =
        data.filter(item => item.status === "Pendente").length;

    document.getElementById("confirmados").textContent =
        data.filter(item => item.status === "Confirmado").length;

    if (data.length === 0) {
        lista.innerHTML = "<p>Nenhuma contratação encontrada.</p>";
        return;
    }

    lista.innerHTML = "";

    data.forEach(item => {

        const card = document.createElement("div");
        card.className = "contratacao";

        const informacoes = document.createElement("div");

        informacoes.innerHTML = `
            <h3>${escapar(item.nome)}</h3>
            <p><strong>E-mail:</strong> ${escapar(item.email)}</p>
            <p><strong>Telefone:</strong> ${escapar(item.telefone)}</p>
            <p><strong>CPF:</strong> ${escapar(item.cpf)}</p>
            <p><strong>Curso:</strong> ${escapar(item.curso)}</p>
            <p><strong>Valor:</strong> ${escapar(item.valor)}</p>
            <p><strong>Status:</strong> ${escapar(item.status)}</p>
            <p><strong>Data:</strong> ${escapar(item.created_at)}</p>
        `;

        card.appendChild(informacoes);

        const botoes = document.createElement("div");

        const comprovante = document.createElement("button");
        comprovante.textContent = "Ver comprovante";
        comprovante.onclick = () => verComprovante(item.comprovante);

        const confirmar = document.createElement("button");
        confirmar.textContent = "Confirmar e enviar e-mail";
        confirmar.onclick = () => confirmarContratacao(item.id);

        const recusar = document.createElement("button");
        recusar.textContent = "Marcar como recusado";
        recusar.onclick = () => recusarContratacao(item.id);

        botoes.append(comprovante, confirmar, recusar);
        card.appendChild(botoes);

        lista.appendChild(card);
    });
}

window.carregarContratacoes = carregarContratacoes;


// ======================================
// PROTEGER TEXTO
// ======================================

function escapar(valor) {

    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}


// ======================================
// VER COMPROVANTE
// ======================================

async function verComprovante(caminho) {

    if (!caminho) {
        alert("Esta contratação não possui comprovante.");
        return;
    }

    const { data, error } = await client.storage
        .from("comprovantes")
        .createSignedUrl(caminho, 300);

    if (error) {
        alert("Não foi possível abrir o comprovante: " + error.message);
        return;
    }

    window.open(data.signedUrl, "_blank");
}


// ======================================
// CONFIRMAR CONTRATAÇÃO
// ======================================

async function confirmarContratacao(id) {

    if (!confirm("Deseja confirmar esta contratação e enviar o e-mail?")) {
        return;
    }

    const { data: sessao } = await client.auth.getSession();

    if (!sessao.session) {
        alert("Sua sessão expirou. Entre novamente.");
        return;
    }

    const resposta = await fetch(
        SUPABASE_URL + "/functions/v1/confirmar-contratacao",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + sessao.session.access_token,
                "apikey": SUPABASE_KEY
            },
            body: JSON.stringify({ id })
        }
    );

    const resultado = await resposta.json();

    if (!resposta.ok) {
        alert(resultado.error || "Não foi possível confirmar.");
        return;
    }

    alert("Contratação confirmada e e-mail enviado!");

    carregarContratacoes();
}


// ======================================
// RECUSAR CONTRATAÇÃO
// ======================================

async function recusarContratacao(id) {

    if (!confirm("Deseja marcar esta contratação como recusada?")) {
        return;
    }

    const { error } = await client
        .from("contratacoes")
        .update({ status: "Recusado" })
        .eq("id", id);

    if (error) {
        alert("Erro: " + error.message);
        return;
    }

    alert("Contratação marcada como recusada.");

    carregarContratacoes();
}


// ======================================
// INICIAR SISTEMA
// ======================================

document.addEventListener("DOMContentLoaded", verificarSessao);
