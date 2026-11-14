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

const mensagem = document.getElementById("mensagem");

const parametros = new URLSearchParams(location.search);

const destinoSolicitado = parametros.get("redirect");

const destino = destinoSolicitado &&
    destinoSolicitado.startsWith("/") &&
    !destinoSolicitado.startsWith("//")
    ? destinoSolicitado
    : "index.html";

localStorage.setItem("destinoLogin", destino);

// LOGIN
document.getElementById("formLogin").addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        mensagem.textContent = "Entrando...";

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: senha
        });

        if (error) {
            mensagem.textContent = error.message;
            return;
        }

        const destinoSalvo =
            localStorage.getItem("destinoLogin") || "index.html";

        localStorage.removeItem("destinoLogin");

        window.location.href = destinoSalvo;
    }
);

// CADASTRO
document.getElementById("cadastrar").addEventListener(
    "click",
    async function() {

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        if (!email || !senha) {
            mensagem.textContent =
                "Preencha seu e-mail e sua senha.";
            return;
        }

        if (senha.length < 6) {
            mensagem.textContent =
                "A senha deve ter pelo menos 6 caracteres.";
            return;
        }

        mensagem.textContent = "Criando sua conta...";

        const { data, error } = await supabase.auth.signUp({
            email,
            password: senha
        });

        if (error) {
            mensagem.textContent = error.message;
            return;
        }

        if (!data.session) {
            mensagem.textContent =
                "Conta criada! Confira seu e-mail para confirmar o cadastro. Depois, entre na sua conta.";
            return;
        }

        const destinoSalvo =
            localStorage.getItem("destinoLogin") || "index.html";

        localStorage.removeItem("destinoLogin");

        window.location.href = destinoSalvo;
    }
);

// RECUPERAR SENHA
document.getElementById("recuperar").addEventListener(
    "click",
    async function() {

        const email = document.getElementById("email").value;

        if (!email) {
            mensagem.textContent =
                "Digite seu e-mail primeiro.";
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(
            email,
            {
                redirectTo: location.origin + "/login.html"
            }
        );

        if (error) {
            mensagem.textContent = error.message;
            return;
        }

        mensagem.textContent =
            "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.";
    }
);
