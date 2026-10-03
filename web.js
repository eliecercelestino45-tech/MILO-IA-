const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = process.env.WEB_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   ARCHIVOS WEB
========================= */

app.use(
    express.static(
        path.join(__dirname, "web")
    )
);

/* =========================
   INICIO
========================= */

app.get("/", (req, res) => {
    const archivo =
        path.join(
            __dirname,
            "web",
            "index.html"
        );

    res.sendFile(archivo);
});

/* =========================
   LOGIN DISCORD
========================= */

app.get("/login", (req, res) => {
    if (
        !process.env.CLIENT_ID ||
        !process.env.DISCORD_REDIRECT_URI
    ) {
        return res.status(500).send(
            "La configuración OAuth2 de Discord está incompleta."
        );
    }

    const params = new URLSearchParams({
        client_id:
            process.env.CLIENT_ID,

        response_type: "code",

        redirect_uri:
            process.env.DISCORD_REDIRECT_URI,

        scope: "identify"
    });

    res.redirect(
        `https://discord.com/oauth2/authorize?${params.toString()}`
    );
});

/* =========================
   CALLBACK DISCORD
========================= */

app.get(
    "/auth/discord",
    async (req, res) => {
        const { code } = req.query;

        if (!code) {
            return res.status(400).send(
                "Código de autenticación faltante."
            );
        }

        try {
            const tokenResponse =
                await fetch(
                    "https://discord.com/api/oauth2/token",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        },

                        body:
                            new URLSearchParams({
                                client_id:
                                    process.env.CLIENT_ID,

                                client_secret:
                                    process.env
                                        .DISCORD_CLIENT_SECRET,

                                grant_type:
                                    "authorization_code",

                                code,

                                redirect_uri:
                                    process.env
                                        .DISCORD_REDIRECT_URI
                            })
                    }
                );

            const token =
                await tokenResponse.json();

            if (!token.access_token) {
                return res.status(401).send(
                    "No se pudo iniciar sesión con Discord."
                );
            }

            const userResponse =
                await fetch(
                    "https://discord.com/api/users/@me",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token.access_token}`
                        }
                    }
                );

            const user =
                await userResponse.json();

            /*
             * Por ahora devolvemos los datos.
             * La sesión completa se conectará
             * con el sistema de funciones.
             */

            res.json({
                success: true,

                user: {
                    id: user.id,
                    username:
                        user.username,
                    global_name:
                        user.global_name,
                    avatar:
                        user.avatar
                }
            });
        } catch (error) {
            console.error(
                "❌ Error OAuth2:",
                error
            );

            res.status(500).send(
                "Ocurrió un error al iniciar sesión."
            );
        }
    }
);

/* =========================
   API DE SALUD
========================= */

app.get(
    "/health",
    (req, res) => {
        res.json({
            status: "online",
            service: "Milo IA",
            time: new Date().toISOString()
        });
    }
);

/* =========================
   API INFO
========================= */

app.get(
    "/api/info",
    (req, res) => {
        res.json({
            name: "Milo IA",
            status: "online",
            version: "1.0.0"
        });
    }
);

/* =========================
   INICIAR WEB
========================= */

app.listen(
    PORT,
    () => {
        console.log(
            `🌐 Web de Milo activa en el puerto ${PORT}`
        );
    }
);
