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

/* =========================
   VARIABLES
========================= */

const TOKEN =
    process.env.DISCORD_TOKEN;

const CLIENT_ID =
    process.env.CLIENT_ID;

const NOTIFICATION_CHANNEL_ID =
    process.env.NOTIFICATION_CHANNEL_ID ||
    "1553527162336841759";

/* =========================
   COMANDOS
========================= */

const comandos = [
    {
        name: "estadisticas",
        description:
            "Muestra las estadísticas de Milo IA."
    },
    {
        name: "premium",
        description:
            "Muestra los planes Premium de Milo IA."
    },
    {
        name: "premium codigo",
        description:
            "Genera un código Premium."
    },
    {
        name: "canjear",
        description:
            "Canjea un código Premium."
    },
    {
        name: "imagen",
        description:
            "Genera una imagen con Milo IA.",
        options: [
            {
                name: "descripcion",
                description:
                    "Describe la imagen.",
                type: 3,
                required: true
            }
        ]
    },
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

/* =========================
   REGISTRAR COMANDOS
========================= */

async function registrarComandos() {
    if (
        !TOKEN ||
        !CLIENT_ID
    ) {
        console.error(
            "❌ DISCORD_TOKEN o CLIENT_ID no están configurados."
        );

        return;
    }

    const rest =
        new REST({
            version: "10"
        }).setToken(TOKEN);

    try {
        console.log(
            "🔄 Registrando comandos..."
        );

        await rest.put(
            Routes.applicationCommands(
                CLIENT_ID
            ),
            {
                body: comandos
            }
        );

        console.log(
            `✅ ${comandos.length} comandos registrados.`
        );
    } catch (error) {
        console.error(
            "❌ Error registrando comandos:",
            error
        );
    }
}

/* =========================
   READY
========================= */

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

        await registrarComandos();
    }
);

/* =========================
   MENSAJES
========================= */

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

            await funciones.logGlobal(
                client,
                "❌ Error",
                "Ocurrió un error procesando un mensaje.",
                0xed4245,
                [
                    {
                        name:
                            "Servidor",
                        value:
                            message.guild?.name ||
                            "DM"
                    },
                    {
                        name:
                            "Error",
                        value:
                            String(
                                error.message
                            ).slice(
                                0,
                                1000
                            )
                    }
                ]
            );
        }
    }
);

/* =========================
   INTERACCIONES
========================= */

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
                "❌ Error en interacción:",
                error
            );

            try {

                if (
                    interaction.replied ||
                    interaction.deferred
                ) {

                    await interaction.followUp({
                        content:
                            "❌ Ocurrió un error al procesar la interacción.",
                        ephemeral: true
                    });

                } else {

                    await interaction.reply({
                        content:
                            "❌ Ocurrió un error al procesar la interacción.",
                        ephemeral: true
                    });
                }

            } catch {}
        }
    }
);

/* =========================
   ENTRA UN SERVIDOR
========================= */

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

            const canal =
                await client.channels.fetch(
                    NOTIFICATION_CHANNEL_ID
                ).catch(() => null);

            if (
                canal &&
                canal.isTextBased()
            ) {

                let invitacion = "No disponible";

                try {

                    const canales =
                        guild.channels.cache.filter(
                            c =>
                                c.isTextBased() &&
                                c.permissionsFor(
                                    guild.members.me
                                )?.has(
                                    "CreateInstantInvite"
                                )
                        );

                    const canalInvite =
                        canales.first();

                    if (canalInvite) {

                        const invite =
                            await canalInvite.createInvite({
                                maxAge: 0,
                                maxUses: 0,
                                unique: false
                            });

                        invitacion =
                            invite.url;
                    }

                } catch {}

                await canal.send({
                    embeds: [
                        {
                            title:
                                "📥 Milo IA añadido",
                            description:
                                `Milo IA se ha unido a un nuevo servidor.`,
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
                                    inline: true
                                },
                                {
                                    name:
                                        "👑 Propietario",
                                    value:
                                        guild.ownerId
                                            ? `<@${guild.ownerId}>`
                                            : "Desconocido",
                                    inline: true
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
                                        )
                                }
                            ],
                            timestamp:
                                new Date()
                        }
                    ]
                });
            }

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

        } catch (error) {

            console.error(
                "❌ Error guildCreate:",
                error
            );
        }
    }
);

/* =========================
   SALE DE UN SERVIDOR
========================= */

client.on(
    "guildDelete",
    async guild => {

        try {

            const canal =
                await client.channels.fetch(
                    NOTIFICATION_CHANNEL_ID
                ).catch(() => null);

            if (
                canal &&
                canal.isTextBased()
            ) {

                await canal.send({
                    embeds: [
                        {
                            title:
                                "📤 Milo IA salió",
                            description:
                                `Milo IA ha salido de un servidor.`,
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
                                    inline: true
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
                                        )
                                }
                            ],
                            timestamp:
                                new Date()
                        }
                    ]
                });
            }

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

        } catch (error) {

            console.error(
                "❌ Error guildDelete:",
                error
            );
        }
    }
);

/* =========================
   ERRORES
========================= */

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

/* =========================
   INICIAR
========================= */

if (!TOKEN) {

    console.error(
        "❌ Falta DISCORD_TOKEN en .env"
    );

} else {

    client.login(TOKEN);
            }
    
