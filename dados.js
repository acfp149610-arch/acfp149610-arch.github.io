import { createClient } from
"https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL =
"https://kghzycpuvlidoenqnhhb.supabase.co";

const SUPABASE_KEY =
"sb_publishable_IntMzNdV-nhtxW8czMBijA_4yVRgbIp";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function iniciarCadastro() {

    const { data } = await supabase.auth.getSession();

    if (!data.session) {

        const destino =
            window.location.pathname +
            window.location.search;

        window.location.replace(
            "login.html?redirect=" +
            encodeURIComponent(destino)
        );

        return;
    }

    const parametros =
        new URLSearchParams(window.location.search);

    const numeroCurso = parametros.get("curso");

    const campoCurso =
        document.getElementById("curso");

    if (numeroCurso === "1") {
        campoCurso.value = "Curso 1";

    } else if (numeroCurso === "2") {
        campoCurso.value = "Curso 2";

    } else {
        alert("Curso não identificado!");
        return;
    }

    document.getElementById("formCadastro").addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const { data: sessao } =
                await supabase.auth.getSession();

            if (!sessao.session) {
                window.location.href = "login.html";
                return;
            }

            const usuario = sessao.session.user;

            const dados = {
                nome: this.nome.value,
                email: usuario.email,
                telefone: this.telefone.value,
                cpf: this.cpf.value,
                curso: campoCurso.value,
                valor: 1.00,
                usuario_id: usuario.id
            };

            localStorage.setItem(
                "dadosCliente",
                JSON.stringify(dados)
            );

            window.location.href = "pagamento.html";
        }
    );
}

iniciarCadastro().catch(error => {
    console.error(error);
    alert("Erro ao carregar o cadastro.");
});
