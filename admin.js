const SUPABASE_URL = "https://kghzycpuvlidoenqnhhb.supabase.co";

const SUPABASE_KEY = "sb_publishable_IntMzNdV-nhtxW8czMBij";

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
async function verificarSessao() {
    const { data, error } = await client.auth.getSession();

    if (error || !data.session) {
        return;
    }

    const { data: admin, error: erroAdmin } = await client
        .from("admins")
        .select("user_id")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

    if (erroAdmin || !admin) {
        await client.auth.signOut();
        return;
    }

    document.getElementById("login").style.display = "none";
    document.getElementById("painel").style.display = "block";

    carregarContratacoes();
}

document.addEventListener("DOMContentLoaded", verificarSessao);
async function entrar() {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const mensagem = document.getElementById("mensagem");

    mensagem.textContent = "Verificando acesso...";

    const { data, error } = await client.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (error) {
    mensagem.textContent = "Erro: " + error.message;
    console.log(error);
    return;
    }

    const { data: admin, error: erroAdmin } = await client
        .from("admins")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

    if (erroAdmin || !admin) {
        await client.auth.signOut();
        mensagem.textContent = "Login realizado, mas este usuário não é administrador.";
        return;
    }

    document.getElementById("login").style.display = "none";
    document.getElementById("painel").style.display = "block";

    carregarContratacoes();
}

async function carregarContratacoes() {
    const lista = document.getElementById("listaContratacoes");

    lista.innerHTML = "<p>Carregando contratações...</p>";

    const { data, error } = await client
        .from("contratacoes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        lista.innerHTML = "<p>Erro ao carregar: " + escapar(error.message) + "</p>";
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
            <p><strong>Status:</strong> <span class="status">${escapar(item.status)}</span></p>
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

function escapar(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

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

async function confirmarContratacao(id) {
    if (!confirm("Deseja confirmar esta contratação e enviar o e-mail?")) {
        return;
    }

    const { data: sessao } = await client.auth.getSession();

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
