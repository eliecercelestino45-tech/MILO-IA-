require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
    ActivityType
} = require("discord.js");

const funciones = require("./funciones");

require("./web");

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const NOTIFICATION_CHANNEL_ID =
    process.env.NOTIFICATION_CHANNEL_ID ||
    "1553527162336841759";

/* =========================================================
   CLIENTE
========================================================= */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],

    partials: [
        Partials.Channel
    ]
});

/* =========================================================
   COMANDOS SLASH
========================================================= */

const comandos = [

    /* =========================
       ESTADÍSTICAS
    ========================= */

    {
        name: "estadisticas",
        description:
            "Muestra las estadísticas de Milo IA."
    },

    /* =========================
       PREMIUM
    ========================= */

    {
        name: "premium",

        description:
            "Muestra los planes Premium de Milo IA.",

        options: [

            {
                name: "codigo",

                description:
                    "Genera un código Premium.",

                type: 1,

                options: [

                    {
                        name: "tipo",

                        description:
                            "Dónde se aplicará el Premium.",

                        type: 3,

                        required: true,

                        choices: [
                            {
                                name: "Servidor",
                                value: "server"
                            },
                            {
                                name: "Usuario",
                                value: "user"
                            }
                        ]
                    },

                    {
                        name: "plan",

                        description:
                            "Selecciona el plan Premium.",

                        type: 3,

                        required: true,

                        choices: [
                            {
                                name: "Básico",
                                value: "basico"
                            },
                            {
                                name: "Pro",
                                value: "pro"
                            },
                            {
                                name: "Ultra",
                                value: "ultra"
                            }
                        ]
                    },

                    {
                        name: "duracion",

                        description:
                            "Duración del Premium.",

                        type: 3,

                        required: true
                    },

                    {
                        name: "usos",

                        description:
                            "Cantidad de usos del código.",

                        type: 4,

                        required: true,

                        min_value: 1
                    }

                ]
            }

        ]
    },

    /* =========================
       CANJEAR
    ========================= */

    {
        name: "canjear",

        description:
            "Canjea un código Premium."
    },

    /* =========================
       IMAGEN
    ========================= */

    {
        name: "imagen",

        description:
            "Genera una imagen con Milo IA.",

        options: [

            {
                name: "descripcion",

                description:
                    "Describe la imagen que quieres crear.",

                type: 3,

                required: true
            }

        ]
    },

    /* =========================
       PANEL
    ========================= */

    {
        name: "panel",

        description:
            "Crea un panel de tickets.",

        options: [

            {
                name: "descripcion",

                description:
                    "Describe cómo quieres el panel.",

                type: 3,

                required: true
            },

            {
                name: "rol_soporte",

                description:
                    "Rol encargado del soporte.",

                type: 8,

                required: true
            },

            {
                name: "canal",

                description:
                    "Canal donde se enviará el panel.",

                type: 7,

                required: true
            }

        ]
    }

];

/* =========================================================
   REGISTRAR COMANDOS
========================================================= */

async function registrarComandos() {

    if (!TOKEN) {
        console.error(
            "❌ Falta DISCORD_TOKEN en .env"
        );
        return false;
    }

    if (!CLIENT_ID) {
        console.error(
            "❌ Falta CLIENT_ID en .env"
        );
        return false;
    }

    try {

        console.log(
            "🔄 Registrando comandos..."
        );

        const rest = new REST({
            version: "10"
        }).setToken(TOKEN);

        await rest.put(
            Routes.applicationCommands(
                CLIENT_ID
            ),
            {
                body: comandos
            }
        );

        console.log(
            `✅ ${comandos.length} comandos registrados correctamente.`
        );

        return true;

    } catch (error) {

        console.error(
            "❌ Error registrando comandos:"
        );

        console.error(
            error
        );

        return false;
    }
}

/* =========================================================
   PRESENCIA
========================================================= */

function actualizarPresencia() {

    if (!client.user) {
        return;
    }

    client.user.setPresence({

        activities: [
            {
                name:
                    `${client.guilds.cache.size} servidores | Milo IA`,

                type:
                    ActivityType.Playing
            }
        ],

        status:
            "online"
    });
}

/* =========================================================
   BOT LISTO
========================================================= */

client.once(
    "ready",
    async () => {

        console.log(
            "========================================"
        );

        console.log(
            `🤖 Milo IA conectado como ${client.user.tag}`
        );

        console.log(
            `🌐 Servidores: ${client.guilds.cache.size}`
        );

        console.log(
            "========================================"
        );

        actualizarPresencia();

        await registrarComandos();
    }
);

/* =========================================================
   MENSAJES
========================================================= */

client.on(
    "messageCreate",
    async message => {

        try {

            await funciones.procesarMensaje(
                client,
                message
            );

        } catch (error) {

            console.error(
                "❌ Error procesando mensaje:",
                error
            );

            try {

                await funciones.logGlobal(

                    client,

                    "❌ Error procesando mensaje",

                    String(
                        error?.message ||
                        error
                    ).slice(
                        0,
                        4000
                    ),

                    0xed4245,

                    [
                        {
                            name:
                                "👤 Usuario",

                            value:
                                message.author
                                    ? `${message.author.tag} (${message.author.id})`
                                    : "Desconocido"
                        },

                        {
                            name:
                                "🏠 Servidor",

                            value:
                                message.guild?.name ||
                                "DM"
                        }
                    ]
                );

            } catch {}
        }
    }
);

/* =========================================================
   INTERACCIONES
========================================================= */

client.on(
    "interactionCreate",
    async interaction => {

        try {

            await funciones.procesarInteraccion(
                client,
                interaction
            );

        } catch (error) {

            console.error(
                "❌ Error procesando interacción:",
                error
            );

            try {

                const respuesta = {
                    content:
                        "❌ Ocurrió un error al procesar esta interacción.",

                    ephemeral:
                        true
                };

                if (
                    interaction.replied ||
                    interaction.deferred
                ) {

                    await interaction.followUp(
                        respuesta
                    );

                } else {

                    await interaction.reply(
                        respuesta
                    );
                }

            } catch {}
        }
    }
);

/* =========================================================
   ENTRA A UN SERVIDOR
========================================================= */

client.on(
    "guildCreate",
    async guild => {

        try {

            const datos =
                funciones.cargarDatos();

            await funciones.inicializarServidor(
                client,
                guild,
                datos
            );

            let invitacion =
                "No disponible";

            /* =========================
               CREAR INVITACIÓN
            ========================= */

            try {

                const botMember =
                    guild.members.me;

                if (botMember) {

                    const canales =
                        guild.channels.cache.filter(
                            canal =>
                                canal.isTextBased() &&
                                canal
                                    .permissionsFor(
                                        botMember
                                    )
                                    ?.has(
                                        "CreateInstantInvite"
                                    )
                        );

                    const canal =
                        canales.first();

                    if (canal) {

                        const invite =
                            await canal.createInvite({
                                maxAge: 0,
                                maxUses: 0,
                                unique: false
                            });

                        invitacion =
                            invite.url;
                    }
                }

            } catch {}

            /* =========================
               CANAL NOTIFICACIONES
            ========================= */

            const canalNotificacion =
                await client.channels.fetch(
                    NOTIFICATION_CHANNEL_ID
                ).catch(() => null);

            if (
                canalNotificacion &&
                canalNotificacion.isTextBased()
            ) {

                await canalNotificacion.send({

                    embeds: [

                        {
                            title:
                                "📥 Milo IA añadido",

                            description:
                                "Milo IA se ha unido a un nuevo servidor.",

                            color:
                                0x57f287,

                            fields: [

                                {
                                    name:
                                        "🏠 Servidor",

                                    value:
                                        guild.name
                                },

                                {
                                    name:
                                        "👥 Miembros",

                                    value:
                                        String(
                                            guild.memberCount
                                        ),

                                    inline:
                                        true
                                },

                                {
                                    name:
                                        "👑 Propietario",

                                    value:
                                        guild.ownerId
                                            ? `<@${guild.ownerId}>`
                                            : "Desconocido",

                                    inline:
                                        true
                                },

                                {
                                    name:
                                        "📅 Fecha",

                                    value:
                                        `<t:${Math.floor(
                                            Date.now() / 1000
                                        )}:F>`
                                },

                                {
                                    name:
                                        "🔗 Invitar a Milo",

                                    value:
                                        invitacion
                                },

                                {
                                    name:
                                        "🌐 Servidores actuales",

                                    value:
                                        String(
                                            client.guilds.cache.size
                                        ),

                                    inline:
                                        true
                                }

                            ],

                            timestamp:
                                new Date()
                        }

                    ]
                });
            }

            /* =========================
               LOG GLOBAL
            ========================= */

            await funciones.logGlobal(

                client,

                "📥 Nuevo servidor",

                `Milo IA entró a **${guild.name}**.`,

                0x57f287,

                [
                    {
                        name:
                            "👥 Miembros",

                        value:
                            String(
                                guild.memberCount
                            )
                    }
                ]
            );

            actualizarPresencia();

        } catch (error) {

            console.error(
                "❌ Error en guildCreate:",
                error
            );
        }
    }
);

/* =========================================================
   SALE DE UN SERVIDOR
========================================================= */

client.on(
    "guildDelete",
    async guild => {

        try {

            const canalNotificacion =
                await client.channels.fetch(
                    NOTIFICATION_CHANNEL_ID
                ).catch(() => null);

            if (
                canalNotificacion &&
                canalNotificacion.isTextBased()
            ) {

                await canalNotificacion.send({

                    embeds: [

                        {
                            title:
                                "📤 Milo IA salió",

                            description:
                                "Milo IA ha salido de un servidor.",

                            color:
                                0xed4245,

                            fields: [

                                {
                                    name:
                                        "🏠 Servidor",

                                    value:
                                        guild.name
                                },

                                {
                                    name:
                                        "👥 Miembros",

                                    value:
                                        String(
                                            guild.memberCount ||
                                            0
                                        ),

                                    inline:
                                        true
                                },

                                {
                                    name:
                                        "📅 Fecha",

                                    value:
                                        `<t:${Math.floor(
                                            Date.now() / 1000
                                        )}:F>`
                                },

                                {
                                    name:
                                        "🌐 Servidores actuales",

                                    value:
                                        String(
                                            client.guilds.cache.size
                                        ),

                                    inline:
                                        true
                                }

                            ],

                            timestamp:
                                new Date()
                        }

                    ]
                });
            }

            /* =========================
               LOG GLOBAL
            ========================= */

            await funciones.logGlobal(

                client,

                "📤 Servidor abandonado",

                `Milo IA salió de **${guild.name}**.`,

                0xed4245,

                [
                    {
                        name:
                            "👥 Miembros",

                        value:
                            String(
                                guild.memberCount ||
                                0
                            )
                    }
                ]
            );

            actualizarPresencia();

        } catch (error) {

            console.error(
                "❌ Error en guildDelete:",
                error
            );
        }
    }
);

/* =========================================================
   ERROR: PROMESAS
========================================================= */

process.on(
    "unhandledRejection",
    async error => {

        console.error(
            "❌ Unhandled Rejection:",
            error
        );

        try {

            await funciones.logGlobal(

                client,

                "❌ Unhandled Rejection",

                String(
                    error?.message ||
                    error
                ).slice(
                    0,
                    4000
                ),

                0xed4245
            );

        } catch {}
    }
);

/* =========================================================
   ERROR: EXCEPCIÓN
========================================================= */

process.on(
    "uncaughtException",
    async error => {

        console.error(
            "❌ Uncaught Exception:",
            error
        );

        try {

            await funciones.logGlobal(

                client,

                "❌ Uncaught Exception",

                String(
                    error?.message ||
                    error
                ).slice(
                    0,
                    4000
                ),

                0xed4245
            );

        } catch {}
    }
);

/* =========================================================
   INICIAR MILO
========================================================= */

if (!TOKEN) {

    console.error(
        "❌ No se puede iniciar Milo IA."
    );

    console.error(
        "❌ Falta DISCORD_TOKEN en .env"
    );

} else {

    client.login(TOKEN)

        .then(() => {

            console.log(
                "🚀 Milo IA iniciando..."
            );

        })

        .catch(error => {

            console.error(
                "❌ Error iniciando sesión:",
                error
            );

        });
}
