require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ChannelType,
    PermissionFlagsBits
} = require("discord.js");

const {
    createPanel,
    getPanel,
    getGuildPanels,
    updatePanel,
    deletePanel
} = require("./panelSystem");

const {
    createTicket,
    getTicket,
    getTickets,
    updateTicket,
    deleteTicket,
    getUserTickets,
    getGuildTickets
} = require("./ticketSystem");

const {
    getConfig,
    createConfig,
    updateConfig,
    resetConfig
} = require("./configSystem");

const {
    banUser,
    getBan,
    isBanned,
    unbanUser,
    getAllBans
} = require("./globalBanSystem");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User
    ]
});

const GLOBAL_BAN_GUILD = "1553169784697528450";
const GLOBAL_BAN_ROLE = "1553526636547280967";

const SHIELD_EMOJI = "<:Shield:1536650664065896528>";
const CLOSE_EMOJI = "<:no:1517158634810767>";

const commands = [
    new SlashCommandBuilder()
        .setName("panel")
        .setDescription("Gestiona los paneles de tickets")
        .addSubcommand(sub =>
            sub
                .setName("create")
                .setDescription("Crea un nuevo panel de tickets")
        )
        .addSubcommand(sub =>
            sub
                .setName("edit")
                .setDescription("Edita un panel existente")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("ID del panel")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("delete")
                .setDescription("Elimina un panel")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("ID del panel")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("list")
                .setDescription("Muestra los paneles del servidor")
        ),

    new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Gestiona tickets")
        .addSubcommand(sub =>
            sub
                .setName("add")
                .setDescription("Añade un usuario al ticket")
                .addUserOption(o =>
                    o.setName("usuario")
                        .setDescription("Usuario")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("remove")
                .setDescription("Elimina un usuario del ticket")
                .addUserOption(o =>
                    o.setName("usuario")
                        .setDescription("Usuario")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("close")
                .setDescription("Cierra el ticket")
        )
        .addSubcommand(sub =>
            sub
                .setName("claim")
                .setDescription("Reclama el ticket")
        )
        .addSubcommand(sub =>
            sub
                .setName("unclaim")
                .setDescription("Libera el ticket")
        )
        .addSubcommand(sub =>
            sub
                .setName("rename")
                .setDescription("Cambia el nombre del ticket")
                .addStringOption(o =>
                    o.setName("nombre")
                        .setDescription("Nuevo nombre")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("lock")
                .setDescription("Bloquea el ticket")
        )
        .addSubcommand(sub =>
            sub
                .setName("unlock")
                .setDescription("Desbloquea el ticket")
        )
        .addSubcommand(sub =>
            sub
                .setName("transfer")
                .setDescription("Transfiere el ticket")
                .addUserOption(o =>
                    o.setName("usuario")
                        .setDescription("Nuevo responsable")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("info")
                .setDescription("Muestra información del ticket")
        )
        .addSubcommand(sub =>
            sub
                .setName("transcript")
                .setDescription("Genera el transcript del ticket")
        )
        .addSubcommand(sub =>
            sub
                .setName("delete")
                .setDescription("Elimina el ticket")
        )
        .addSubcommand(sub =>
            sub
                .setName("reopen")
                .setDescription("Reabre un ticket")
        ),

    new SlashCommandBuilder()
        .setName("config")
        .setDescription("Configuración de Milo Ticket")
        .addSubcommand(sub =>
            sub.setName("view")
                .setDescription("Muestra la configuración")
        )
        .addSubcommand(sub =>
            sub.setName("reset")
                .setDescription("Restablece la configuración")
        )
        .addSubcommand(sub =>
            sub.setName("logs")
                .setDescription("Configura el canal de logs")
                .addChannelOption(o =>
                    o.setName("canal")
                        .setDescription("Canal de logs")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName("staff")
                .setDescription("Configura el rol de Staff")
                .addRoleOption(o =>
                    o.setName("rol")
                        .setDescription("Rol de Staff")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName("category")
                .setDescription("Configura la categoría de tickets")
                .addChannelOption(o =>
                    o.setName("categoria")
                        .setDescription("Categoría")
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                )
        ),

    new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Muestra estadísticas de Milo Ticket"),

    new SlashCommandBuilder()
        .setName("tickets")
        .setDescription("Muestra tus tickets"),

    new SlashCommandBuilder()
        .setName("staff")
        .setDescription("Muestra información del Staff"),

    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Muestra la latencia del bot"),

    new SlashCommandBuilder()
        .setName("help")
        .setDescription("Muestra la ayuda de Milo Ticket"),

    new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription("Muestra información del bot"),

    new SlashCommandBuilder()
        .setName("ban-global")
        .setDescription("Realiza un bloqueo global")
        .addStringOption(o =>
            o.setName("id")
                .setDescription("ID del usuario")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("motivo")
                .setDescription("Motivo del bloqueo")
                .setRequired(true)
        )
        .addBooleanOption(o =>
            o.setName("permanente")
                .setDescription("¿El bloqueo será permanente?")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("duracion")
                .setDescription("Fecha de expiración ISO si no es permanente")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("unban-global")
        .setDescription("Retira un bloqueo global")
        .addStringOption(o =>
            o.setName("id")
                .setDescription("ID del usuario")
                .setRequired(true)
        )
].map(command => command.toJSON());

function isAdministrator(interaction) {
    return interaction.member?.permissions?.has(
        PermissionFlagsBits.Administrator
    );
}

function canGlobalBan(interaction) {
    if (!interaction.guild) return false;

    if (interaction.guild.id !== GLOBAL_BAN_GUILD) {
        return false;
    }

    return interaction.member.roles.cache.has(GLOBAL_BAN_ROLE);
}

function makePanelId() {
    return `${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;
}

function getTicketFromChannel(channelId) {
    const all = getTickets();

    return Object.values(all).find(
        ticket => ticket.channelId === channelId
    );
}

function hasStaffRole(interaction, ticket) {
    if (!ticket) return false;

    const roleId = ticket.staffRoleId;

    if (!roleId) return false;

    return interaction.member.roles.cache.has(roleId);
}

async function registerCommands() {
    const rest = new REST({ version: "10" })
        .setToken(process.env.TOKEN);

    await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        {
            body: commands
        }
    );

    console.log("✅ Comandos registrados correctamente.");
}

async function sendWelcome(guild) {
    const channel = guild.systemChannel;

    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎫 Milo Ticket")
        .setDescription(
            `¡Gracias por añadir **Milo Ticket** a tu servidor!\n\n` +
            `Milo Ticket es un sistema público de tickets para gestionar soporte de forma organizada.\n\n` +
            `💙 Servidor de soporte:\n` +
            `https://discord.gg/csnebvXgSv`
        )
        .setFooter({
            text: "Milo Ticket"
        });

    const guide = new EmbedBuilder()
        .setColor("#2B2D31")
        .setTitle("📖 Guía rápida")
        .setDescription(
            [
                "**Paneles**",
                "`/panel create` — Crear panel",
                "`/panel edit` — Editar panel",
                "`/panel delete` — Eliminar panel",
                "`/panel list` — Ver paneles",
                "",
                "**Tickets**",
                "`/ticket add` — Añadir usuario",
                "`/ticket remove` — Quitar usuario",
                "`/ticket close` — Cerrar ticket",
                "`/ticket claim` — Reclamar ticket",
                "`/ticket unclaim` — Liberar ticket",
                "`/ticket rename` — Renombrar ticket",
                "`/ticket lock` — Bloquear ticket",
                "`/ticket unlock` — Desbloquear ticket",
                "`/ticket transfer` — Transferir ticket",
                "`/ticket info` — Información",
                "`/ticket transcript` — Transcript",
                "`/ticket delete` — Eliminar ticket",
                "`/ticket reopen` — Reabrir ticket",
                "",
                "**Información**",
                "`/stats`",
                "`/tickets`",
                "`/staff`",
                "`/ping`",
                "`/help`",
                "`/botinfo`"
            ].join("\n")
        );

    await channel.send({
        content: "¡Gracias por añadir **Milo Ticket** a tu servidor! 💙",
        embeds: [embed, guide]
    });
}

async function createTicketChannel({
    guild,
    user,
    panel,
    option
}) {
    const existing = getUserTickets(user.id).find(
        ticket =>
            ticket.guildId === guild.id &&
            ticket.panelId === panel.id &&
            ticket.status === "open"
    );

    if (existing) {
        const channel = guild.channels.cache.get(
            existing.channelId
        );

        if (channel) {
            return {
                existing: true,
                channel
            };
        }
    }

    const ticketId = `${guild.id}-${user.id}-${Date.now()}`;

    const overwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [
                PermissionFlagsBits.ViewChannel
            ]
        },
        {
            id: user.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles
            ]
        }
    ];

    if (panel.staffRoleId) {
        overwrites.push({
            id: panel.staffRoleId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles
            ]
        });
    }

    const channel = await guild.channels.create({
        name: `ticket-${user.username}`
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, "-")
            .substring(0, 90),
        type: ChannelType.GuildText,
        parent: panel.categoryId || null,
        permissionOverwrites: overwrites
    });

    const ticket = createTicket({
        id: ticketId,
        guildId: guild.id,
        channelId: channel.id,
        userId: user.id,
        panelId: panel.id,
        optionIndex: option.index,
        optionName: option.name,
        staffRoleId: panel.staffRoleId,
        logsChannelId: panel.logsChannelId,
        claimedBy: null,
        status: "open",
        locked: false
    });

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`ticket_claim_${ticket.id}`)
                .setEmoji(SHIELD_EMOJI)
                .setLabel("Reclamar")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`ticket_close_${ticket.id}`)
                .setEmoji(CLOSE_EMOJI)
                .setLabel("Cerrar")
                .setStyle(ButtonStyle.Danger)
        );

    const embed = new EmbedBuilder()
        .setColor(panel.color || "#5865F2")
        .setTitle(`🎫 ${option.name}`)
        .setDescription(
            option.openingMessage &&
            option.openingMessage !== "none"
                ? option.openingMessage
                : "Tu ticket ha sido creado correctamente.\n\nUn miembro del Staff te atenderá lo antes posible."
        )
        .addFields(
            {
                name: "👤 Usuario",
                value: `<@${user.id}>`,
                inline: true
            },
            {
                name: "📂 Categoría",
                value: option.name,
                inline: true
            }
        )
        .setFooter({
            text: "Milo Ticket"
        });

    let content = "";

    if (panel.pingStaff && panel.staffRoleId) {
        content = `<@&${panel.staffRoleId}>`;
    }

    await channel.send({
        content: content || undefined,
        embeds: [embed],
        components: [buttons]
    });

    return {
        existing: false,
        channel,
        ticket
    };
}

async function closeTicket(channel, ticket, closedBy) {
    if (!ticket) return false;

    updateTicket(ticket.id, {
        status: "closed",
        closedBy: closedBy.id,
        closedAt: new Date().toISOString()
    });

    const logsChannel =
        channel.guild.channels.cache.get(
            ticket.logsChannelId
        );

    if (logsChannel) {
        const embed = new EmbedBuilder()
            .setColor("#ED4245")
            .setTitle("🔒 Ticket cerrado")
            .addFields(
                {
                    name: "🎫 Ticket",
                    value: `\`${ticket.id}\``
                },
                {
                    name: "👤 Usuario",
                    value: `<@${ticket.userId}>`
                },
                {
                    name: "🛡️ Cerrado por",
                    value: `<@${closedBy.id}>`
                }
            )
            .setTimestamp();

        await logsChannel.send({
            embeds: [embed]
        }).catch(() => {});
    }

    await channel.delete().catch(() => {});

    return true;
}

client.on("ready", async () => {
    console.log(`🤖 Milo Ticket conectado como ${client.user.tag}`);

    client.user.setPresence({
        status: "dnd",
        activities: [
            {
                name: "+10 bots en funcionamiento | /help",
                type: 0
            }
        ]
    });

    try {
        await registerCommands();
    } catch (error) {
        console.error(
            "❌ Error registrando comandos:",
            error
        );
    }
});

client.on("guildCreate", async guild => {
    console.log(
        `📥 Milo Ticket añadido a: ${guild.name} (${guild.id})`
    );

    try {
        createConfig(guild.id);
        await sendWelcome(guild);
    } catch (error) {
        console.error(
            "❌ Error enviando bienvenida:",
            error
        );
    }
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (
        interaction.guild &&
        isBanned(interaction.user.id)
    ) {
        return interaction.reply({
            content:
                "🚫 Tu cuenta tiene un bloqueo global activo.",
            ephemeral: true
        });
    }

    /*
    ==================================================
                    /PANEL
    ==================================================
    */

    if (interaction.commandName === "panel") {
        if (!isAdministrator(interaction)) {
            return interaction.reply({
                content:
                    "❌ Necesitas permisos de administrador.",
                ephemeral: true
            });
        }

        const sub =
            interaction.options.getSubcommand();

        if (sub === "create") {
            const guild = interaction.guild;
            const user = interaction.user;

            const configChannel =
                await guild.channels.create({
                    name: "panel-uno",
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: [
                                PermissionFlagsBits.ViewChannel
                            ]
                        },
                        {
                            id: user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory
                            ]
                        }
                    ]
                });

            await interaction.reply({
                content:
                    `🎫 Canal de configuración creado: ${configChannel}`,
                ephemeral: true
            });

            await configChannel.send(
                "🎫 **Configuración de Milo Ticket**\n\n" +
                "Menciona el **rol de Staff** que atenderá los tickets."
            );

            const filter = message =>
                message.author.id === user.id;

            try {
                const staffCollected =
                    await configChannel.awaitMessages({
                        filter,
                        max: 1 ,
                        time: 300000
                    });

                if (!staffCollected.size) {
                    await configChannel.delete().catch(() => {});
                    return;
                }

                const staffMessage =
                    staffCollected.first();

                const staffRole =
                    staffMessage.mentions.roles.first();

                if (!staffRole) {
                    await configChannel.send(
                        "❌ Debes mencionar un rol válido."
                    );

                    await configChannel.delete()
                        .catch(() => {});

                    return;
                }

                await configChannel.send(
                    "📂 Ahora escribe el **ID de la categoría** donde se crearán los tickets."
                );

                const categoryCollected =
                    await configChannel.awaitMessages({
                        filter,
                        max: 1,
                        time: 300000
                    });

                if (!categoryCollected.size) {
                    await configChannel.delete()
                        .catch(() => {});
                    return;
                }

                const categoryId =
                    categoryCollected
                        .first()
                        .content
                        .trim();

                const category =
                    guild.channels.cache.get(
                        categoryId
                    );

                if (
                    !category ||
                    category.type !== ChannelType.GuildCategory
                ) {
                    await configChannel.send(
                        "❌ Ese ID no corresponde a una categoría válida."
                    );

                    await configChannel.delete()
                        .catch(() => {});

                    return;
                }

                await configChannel.send(
                    "📜 Menciona el **canal de logs**."
                );

                const logsCollected =
                    await configChannel.awaitMessages({
                        filter,
                        max: 1,
                        time: 300000
                    });

                if (!logsCollected.size) {
                    await configChannel.delete()
                        .catch(() => {});
                    return;
                }

                const logsChannel =
                    logsCollected
                        .first()
                        .mentions.channels.first();

                if (!logsChannel) {
                    await configChannel.send(
                        "❌ Debes mencionar un canal válido."
                    );

                    await configChannel.delete()
                        .catch(() => {});

                    return;
                }

                await configChannel.send(
                    "🎨 **¿Qué tipo de panel quieres?**\n\n" +
                    "1️⃣ Botones\n" +
                    "2️⃣ Menú\n\n" +
                    "Reacciona con 1️⃣ o 2️⃣."
                );

                const typeMessage =
                    await configChannel.send("👇");

                await typeMessage.react("1️⃣");
                await typeMessage.react("2️⃣");

                const reactionFilter =
                    (reaction, reactor) =>
                        ["1️⃣", "2️⃣"].includes(
                            reaction.emoji.name
                        ) &&
                        reactor.id === user.id;

                const collectedReaction =
                    await typeMessage.awaitReactions({
                        filter: reactionFilter,
                        max: 1,
                        time: 300000
                    });

                if (!collectedReaction.size) {
                    await configChannel.delete()
                        .catch(() => {});
                    return;
                }

                const selectedType =
                    collectedReaction.first()
                        .emoji.name === "1️⃣"
                        ? "buttons"
                        : "menu";

                await configChannel.send(
                    "⚙️ **Configuración de opciones**\n\n" +
                    "Escribe cada opción de esta forma:\n" +
                    "`emoji nombre`\n\n" +
                    "Ejemplo:\n" +
                    "`🎫 Soporte`\n" +
                    "`💰 Compras`\n\n" +
                    "Escribe `none` cuando hayas terminado.\n" +
                    "Máximo: **10 opciones**."
                );

                const options = [];

                while (options.length < 10) {
                    const optionCollected =
                        await configChannel.awaitMessages({
                            filter,
                            max: 1,
                            time: 300000
                        });

                    if (!
optionCollected.size) {
                        await configChannel.delete()
                            .catch(() => {});
                        return;
                    }

                    const content =
                        optionCollected
                            .first()
                            .content
                            .trim();

                    if (
                        content.toLowerCase() ===
                        "none"
                    ) {
                        break;
                    }

                    const firstSpace =
                        content.indexOf(" ");

                    if (firstSpace === -1) {
                        await configChannel.send(
                            "❌ Usa el formato: `emoji nombre`."
                        );
                        continue;
                    }

                    const emoji =
                        content.substring(
                            0,
                            firstSpace
                        );

                    const name =
                        content
                            .substring(
                                firstSpace + 1
                            )
                            .trim();

                    if (!name) {
                        await configChannel.send(
                            "❌ Debes escribir un nombre."
                        );
                        continue;
                    }

                    options.push({
                        emoji,
                        name,
                        openingMessage: "none"
                    });

                    await configChannel.send(
                        `✅ Opción registrada: ${emoji} **${name}**`
                    );
