const GOOGLE_SCRIPT_URL ="https://script.google.com/macros/s/AKfycbydQTq9esquZeJ1cTuhTHFkSdpzRS8zYqdmEkVD-ejc3AMKAV3wHA0QeZiGRp2M-r_i/exec";

// CONFIGURAÇÕES DO PIX
const CHAVE_PIX = "03016158299";
const NOME_RECEBEDOR = "ANA CLARA FREITAS PAULINO";
const CIDADE = "MONTES CLAROS";

const cliente = JSON.parse(
    localStorage.getItem("dadosCliente")
);

if (!cliente) {
    alert("Cadastro não encontrado!");
    window.location.href = "index.html";
}

// Valores provisórios
const valores = {
    "Curso 1": 1.00,
    "Curso 2": 1.00
};

const valor = valores[cliente.curso];

document.getElementById("nome").textContent =
    "Aluno: " + cliente.nome;

document.getElementById("curso").textContent =
    "Curso: " + cliente.curso;

document.getElementById("valor").textContent =
    "R$ " + valor.toFixed(2).replace(".", ",");


// FUNÇÃO PARA CRIAR CAMPOS PIX
function campo(id, valor) {
    return id +
        String(valor.length).padStart(2, "0") +
        valor;
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

    return crc.toString(16)
        .toUpperCase()
        .padStart(4, "0");
}


// GERAR PIX
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


// GERAR QR CODE
new QRCode(document.getElementById("qrcode"), {
    text: codigo,
    width: 220,
    height: 220
});


// COPIAR PIX
document.getElementById("copiar").addEventListener("click", async () => {

    await navigator.clipboard.writeText(codigo);

    document.getElementById("mensagem").textContent =
        "Código PIX copiado!";
});


// ENVIAR DADOS PARA O GOOGLE PLANILHAS

async function enviarCadastro() {

    const dados = {
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        cpf: cliente.cpf,
        curso: cliente.curso,
        valor: valor.toFixed(2)
    };

    try {

        console.log("Enviando cadastro:", dados);

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(dados)
        });

        console.log("Solicitação enviada ao Google Apps Script.");

    } catch (erro) {

        console.error("Erro ao enviar cadastro:", erro);

        document.getElementById("mensagem").textContent =
            "Erro ao enviar cadastro. Tente novamente.";

    }
}

enviarCadastro();