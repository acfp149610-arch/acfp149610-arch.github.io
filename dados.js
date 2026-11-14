const SUPABASE_URL = "https://kghzycpuvlidoenqnhhb.supabase.co";
const SUPABASE_KEY = "sb_publishable_IntMzNdV-nhtxW8czMBijA_4yVRgbIp";

async function iniciarCadastro() {
    const { createClient } = await import(
        "https://esm.sh/@supabase/supabase-js@2"
    );

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase.auth.getSession();

    if (error) {
        alert("Não foi possível verificar seu login.");
        return;
    }

    const sessao = data.session;

    if (!sessao) {
        const destino = window.location.pathname + window.location.search;

        window.location.replace(
            "login.html?redirect=" + encodeURIComponent(destino)
        );
        return;
    }

    const parametros = new URLSearchParams(window.location.search);
    const numeroCurso = parametros.get("curso");
    const campoCurso = document.getElementById("curso");

    if (numeroCurso === "1") {
        campoCurso.value = "Curso 1";
    } else if (numeroCurso === "2") {
        campoCurso.value = "Curso 2";
    } else {
        alert("Curso não identificado!");
        return;
    }

    document.getElementById("formCadastro").addEventListener("submit", async function(event) {
        event.preventDefault();

        const { data: dadosSessao } = await supabase.auth.getSession();

        if (!dadosSessao.session) {
            alert("Faça login para continuar.");
            window.location.href = "login.html";
            return;
        }

        const usuario = dadosSessao.session.user;

        const dados = {
            nome: this.nome.value,
            email: this.email.value,
            telefone: this.telefone.value,
            cpf: this.cpf.value,
            curso: campoCurso.value,
            valor: 1.00,
            usuario_id: usuario.id
        };

        localStorage.setItem("dadosCliente", JSON.stringify(dados));

        window.location.href = "pagamento.html";
    });
}

iniciarCadastro().catch(error => {
    console.error(error);
    alert("Erro ao carregar o cadastro. Tente novamente.");
});
