
// CONFIGURAÇÕES
const whatsapp = "5538998906935";

// BOTÕES DE CONTRATAÇÃO
document.querySelectorAll("#cursos button").forEach((botao, index) => {
    botao.addEventListener("click", () => {
        const curso = index === 0 ? "Curso 1" : "Curso 2";

        const mensagem = `Olá, Zé Vitor! Tenho interesse no ${curso}.`;
        const link = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagem)}`;

        window.open(link, "_blank");
    });
});

// QUESTÕES E GOOGLE DRIVE
const linksDrive = {
    "paes1": "COLOQUE_AQUI_O_LINK_DO_PAES_1",
    "paes2": "COLOQUE_AQUI_O_LINK_DO_PAES_2",
    "paes3": "COLOQUE_AQUI_O_LINK_DO_PAES_3"
};

document.querySelectorAll("#questoes p").forEach((questao) => {
    questao.addEventListener("click", () => {
        const id = questao.id;

        if (linksDrive[id]) {
            window.open(linksDrive[id], "_blank");
        } else {
            alert("Link ainda não cadastrado!");
        }
    });
});

// ANIMAÇÃO DAS SEÇÕES
const observador = new IntersectionObserver((elementos) => {
    elementos.forEach((elemento) => {
        if (elemento.isIntersecting) {
            elemento.target.style.opacity = "1";
            elemento.target.style.transform = "translateY(0)";
        }
    });
}, {
    threshold: 0.15
});

document.querySelectorAll("section").forEach((secao) => {
    secao.style.opacity = "0";
    secao.style.transform = "translateY(30px)";
    secao.style.transition = "opacity 0.8s ease, transform 0.8s ease";
    observador.observe(secao);
});
