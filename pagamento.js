
// =====================================
// CONEXÃO COM GOOGLE APPS SCRIPT
// =====================================

const GOOGLE_SCRIPT_URL ="https://script.google.com/macros/s/AKfycbzC-mpufygtNmV9SMjAsFq5AZGYk2pocWQi_FCUxZeFt3p0lgbRFh-v3W_YsBMZXQnEMw/exec";

// =====================================
// CONFIGURAÇÕES DO PIX
// =====================================

// Mantenha aqui os mesmos dados PIX do seu código anterior.
const CHAVE_PIX = "03016158299";
const NOME_RECEBEDOR = "ANA CLARA FREITAS PAULINO";
const CIDADE = "MONTES CLAROS";

// =====================================
// DADOS DO CLIENTE
// =====================================

const cliente = JSON.parse(
    localStorage.getItem("dadosCliente")
);

if (!cliente) {
    alert("Cadastro não encontrado!");
    window.location.href = "index.html";
}

// =====================================
// VALORES DOS CURSOS
// =====================================

const valores = {
    "Curso 1": 1.00,
    "Curso 2": 1.00
};

const valor = valores[cliente.curso];

if (!valor) {
    alert("Curso inválido!");
    window.location.href = "index.html";
}

// =====================================
// MOSTRAR RESUMO
// =====================================

document.getElementById("nome").textContent =
    "Aluno: " + cliente.nome;

document.getElementById("curso").textContent =
    "Curso: " + cliente.curso;

document.getElementById("valor").textContent =
    "R$ " + valor.toFixed(2).replace(".", ",");

// =====================================
// CAMPOS PIX
// =====================================

function campo(id, valor) {
    return id +
        String(valor.length).padStart(2, "0") +
        valor;
}

// =====================================
// CRC16
// =====================================

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

    return crc.toString(16)
        .toUpperCase()
        .padStart(4, "0");
}

// =====================================
// GERAR PIX
// =====================================

function gerarPix() {

    const chave = campo("01", CHAVE_PIX);

    const merchantAccount =
        campo("00", "br.gov.bcb.pix") + chave;

    const merchant = campo("26", merchantAccount);

    const identificador = "ZV" + Date.now();

    const adicional = campo(
        "62",
        campo("05", identificador)
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

    pix += calcularCRC(pix);

    return pix;
}

const codigo = gerarPix();

document.getElementById("codigoPix").value = codigo;

// =====================================
// QR CODE
// =====================================

new QRCode(document.getElementById("qrcode"), {
    text: codigo,
    width: 220,
    height: 220
});

// =====================================
// COPIAR PIX
// =====================================

document.getElementById("copiar").addEventListener(
    "click",
    async () => {

        try {
            await navigator.clipboard.writeText(codigo);

            document.getElementById("mensagem").textContent =
                "Código PIX copiado!";
        } catch (erro) {
            document.getElementById("mensagem").textContent =
                "Não foi possível copiar. Selecione o código manualmente.";
        }
    }
);

// =====================================
// CONVERTER COMPROVANTE EM BASE64
// =====================================

function arquivoBase64(arquivo) {

    return new Promise((resolve, reject) => {

        const leitor = new FileReader();

        leitor.onload = () => {

            const resultado = leitor.result;

            const base64 = resultado.split(",")[1];

            resolve(base64);
        };

        leitor.onerror = () => {
            reject(new Error("Erro ao ler o comprovante."));
        };

        leitor.readAsDataURL(arquivo);
    });
}

// =====================================
// ENVIAR CONTRATAÇÃO
// =====================================

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
        status.textContent =
            "O comprovante deve ter no máximo 5 MB.";
        return;
    }

    botao.disabled = true;
    botao.textContent = "ENVIANDO...";

    status.textContent = "Preparando contratação...";

    try {

        const base64 = await arquivoBase64(arquivo);

        const dados = {

            nome: cliente.nome,
            email: cliente.email,
            telefone: cliente.telefone,
            cpf: cliente.cpf,

            curso: cliente.curso,
            valor: valor.toFixed(2),

            comprovante: {
                nome: arquivo.name,
                tipo: arquivo.type || "application/octet-stream",
                base64: base64
            }
        };

        status.textContent = "Enviando contratação...";

        await fetch(GOOGLE_SCRIPT_URL, {

            method: "POST",

            mode: "no-cors",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify(dados)

        });

        status.textContent =
    "✓ Enviado com sucesso! Seus dados e comprovante foram encaminhados para análise. Aguarde a confirmação da contratação.";

        botao.textContent = "ENVIO SOLICITADO";

        localStorage.removeItem("dadosCliente");

    } catch (erro) {

        console.error(erro);

        status.textContent =
            "Não foi possível enviar. Verifique sua conexão e tente novamente.";

        botao.disabled = false;
        botao.textContent = "FINALIZAR CONTRATAÇÃO";
    }
}

// =====================================
// BOTÃO FINALIZAR
// =====================================

document.getElementById("finalizar").addEventListener(
    "click",
    enviarCadastro
);
