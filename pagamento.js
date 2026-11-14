import { createClient } from
"https://esm.sh/@supabase/supabase-js@2";

// SUPABASE
const SUPABASE_URL =
"https://kghzycpuvlidoenqnhhb.supabase.co";

const SUPABASE_KEY =
"sb_publishable_IntMzNdV-nhtxW8czMBijA_4yVRgbIp";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// PIX
const CHAVE_PIX = "03016158299";
const NOME_RECEBEDOR = "ANA CLARA FREITAS PAULINO";
const CIDADE = "MONTES CLAROS";

// CURSOS
const valores = {
    "Curso 1": 1.00,
    "Curso 2": 1.00
};

let cliente;
let valor;
let codigo;

// INICIALIZAÇÃO
async function iniciar() {

    const { data, error } =
        await supabase.auth.getSession();

    if (error) throw error;

    if (!data.session) {
        window.location.href = "login.html";
        return;
    }

    const usuario = data.session.user;

    cliente = JSON.parse(
        localStorage.getItem("dadosCliente") || "null"
    );

    if (!cliente) {
        alert("Cadastro não encontrado!");
        window.location.href = "index.html";
        return;
    }

    if (cliente.usuario_id !== usuario.id) {
        alert("Esta contratação não pertence à sua conta.");
        window.location.href = "index.html";
        return;
    }

    valor = valores[cliente.curso];

    if (valor === undefined) {
        alert("Curso inválido!");
        window.location.href = "index.html";
        return;
    }

    document.getElementById("nome").textContent =
        "Aluno: " + cliente.nome;

    document.getElementById("curso").textContent =
        "Curso: " + cliente.curso;

    document.getElementById("valor").textContent =
        "R$ " + valor.toFixed(2).replace(".", ",");

    codigo = gerarPix();

    document.getElementById("codigoPix").value = codigo;

    new QRCode(document.getElementById("qrcode"), {
        text: codigo,
        width: 220,
        height: 220
    });

    document.getElementById("copiar").addEventListener(
        "click",
        copiarPix
    );

    document.getElementById("finalizar").addEventListener(
        "click",
        enviarCadastro
    );
}

// CAMPOS PIX
function campo(id, valor) {
    return id + String(valor.length).padStart(2, "0") + valor;
}

// CRC16
function calcularCRC(texto) {

    let crc = 0xFFFF;

    for (let i = 0; i < texto.length; i++) {

        crc ^= texto.charCodeAt(i) << 8;

        for (let j = 0; j < 8; j++) {

            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }

            crc &= 0xFFFF;
        }
    }

    return crc.toString(16).toUpperCase().padStart(4, "0");
}

// GERAR PIX
function gerarPix() {

    const chave = campo("01", CHAVE_PIX);

    const merchantAccount =
        campo("00", "br.gov.bcb.pix") + chave;

    const merchant = campo("26", merchantAccount);

    const adicional = campo(
        "62",
        campo("05", "ZV" + Date.now())
    );

    let pix =
        campo("00", "01") +
        campo("01", "11") +
        merchant +
        campo("52", "0000") +
        campo("53", "986") +
        campo("54", valor.toFixed(2)) +
        campo("58", "BR") +
        campo("59", NOME_RECEBEDOR) +
        campo("60", CIDADE) +
        adicional +
        "6304";

    return pix + calcularCRC(pix);
}

// COPIAR PIX
async function copiarPix() {

    try {

        await navigator.clipboard.writeText(codigo);

        document.getElementById("mensagem").textContent =
            "Código PIX copiado!";

    } catch (erro) {

        document.getElementById("mensagem").textContent =
            "Selecione o código PIX manualmente.";
    }
}

// ENVIAR CONTRATAÇÃO
async function enviarCadastro() {

    const botao = document.getElementById("finalizar");
    const status = document.getElementById("statusEnvio");
    const campoComprovante = document.getElementById("comprovante");

    const arquivo = campoComprovante.files[0];

    if (!arquivo) {
        status.textContent = "Anexe seu comprovante PIX.";
        return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
        status.textContent = "O comprovante deve ter no máximo 5 MB.";
        return;
    }

    botao.disabled = true;
    botao.textContent = "ENVIANDO...";

    let caminhoArquivo = null;

    try {

        const { data: sessao, error: erroSessao } =
            await supabase.auth.getSession();

        if (erroSessao) throw erroSessao;

        if (!sessao.session ||
            sessao.session.user.id !== cliente.usuario_id) {
            throw new Error("Faça login novamente para continuar.");
        }

        const usuario = sessao.session.user;

        status.textContent = "Enviando comprovante...";

        const extensao = arquivo.name.includes(".")
            ? arquivo.name.split(".").pop().toLowerCase()
            : "bin";

        caminhoArquivo =
            usuario.id + "/" + crypto.randomUUID() + "." + extensao;

        const { error: erroUpload } =
            await supabase.storage
                .from("comprovantes")
                .upload(caminhoArquivo, arquivo, {
                    contentType: arquivo.type || "application/octet-stream",
                    upsert: false
                });

        if (erroUpload) throw erroUpload;

        status.textContent = "Salvando contratação...";

        const dados = {
            nome: cliente.nome,
            email: usuario.email,
            telefone: cliente.telefone,
            cpf: cliente.cpf,
            curso: cliente.curso,
            valor: valor.toFixed(2),
            comprovante: caminhoArquivo,
            usuario_id: usuario.id,
            status: "Pendente"
        };

        const { error: erroCadastro } =
            await supabase
                .from("contratacoes")
                .insert([dados]);

        if (erroCadastro) throw erroCadastro;

        status.textContent =
            "✓ Contratação enviada! Aguarde a confirmação do pagamento.";

        botao.textContent = "CONTRATAÇÃO ENVIADA";

        localStorage.removeItem("dadosCliente");

    } catch (erro) {

        console.error("Erro:", erro);

        if (caminhoArquivo) {
            await supabase.storage
                .from("comprovantes")
                .remove([caminhoArquivo]);
        }

        status.textContent =
            "Erro ao enviar: " + erro.message;

        botao.disabled = false;
        botao.textContent = "FINALIZAR CONTRATAÇÃO";
    }
}

iniciar().catch(error => {
    console.error(error);
    alert("Não foi possível carregar o pagamento: " + error.message);
});
