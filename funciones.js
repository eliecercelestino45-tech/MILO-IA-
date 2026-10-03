const fs = require("fs");
const path = require("path");

/* =========================================================
   ARCHIVOS
========================================================= */

const DATA_FILE = path.join(__dirname, "data.json");

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const GLOBAL_LOG_CHANNEL_ID =
    process.env.GLOBAL_LOG_CHANNEL_ID ||
    "1553774365504569464";

const PREMIUM_OWNER_ID =
    process.env.PREMIUM_OWNER_ID ||
    "1553151134754152560";

const GROQ_API_KEY =
    process.env.GROQ_API_KEY;

const GROQ_MODEL =
    process.env.GROQ_MODEL ||
    "llama-3.3-70b-versatile";

const IMAGE_API_KEY =
    process.env.IMAGE_API_KEY;

const IMAGE_MODEL =
    process.env.IMAGE_MODEL;

/* =========================================================
   DATOS
========================================================= */

const DATOS_INICIALES = {
    premium: {
        users: {},
        servers: {},
        codes: {}
    },

    servers: {},

    users: {},

    stats: {
        messages: 0,
        aiResponses: 0,
        images: 0,
        tickets: 0,
        moderations: 0,
        premiumCodesGenerated: 0,
        premiumCodesRedeemed: 0
    }
};

function cargarDatos() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            guardarDatos(
                structuredClone(DATOS_INICIALES)
            );

            return structuredClone(
                DATOS_INICIALES
            );
        }

        const contenido =
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            );

        const datos =
            JSON.parse(contenido);

        return completarDatos(datos);
    } catch (error) {
        console.error(
            "❌ Error cargando data.json:",
            error.message
        );

        return structuredClone(
            DATOS_INICIALES
        );
    }
}

function completarDatos(datos) {
    datos.premium ??= {};
    datos.premium.users ??= {};
    datos.premium.servers ??= {};
    datos.premium.codes ??= {};

    datos.servers ??= {};
    datos.users ??= {};

    datos.stats ??= {};

    for (
        const [clave, valor]
        of Object.entries(
            DATOS_INICIALES.stats
        )
    ) {
        if (
            typeof datos.stats[clave] !==
            "number"
        ) {
            datos.stats[clave] = valor;
        }
    }

    return datos;
}

function guardarDatos(datos) {
    try {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(
                datos,
                null,
                2
            ),
            "utf8"
        );
    } catch (error) {
        console.error(
            "❌ Error guardando data.json:",
            error.message
        );
    }
}

function obtenerDatos() {
    return cargarDatos();
}

function sumarEstadistica(
    nombre,
    cantidad = 1
) {
    const datos = cargarDatos();

    if (
        typeof datos.stats[nombre] !==
        "number"
    ) {
        datos.stats[nombre] = 0;
    }

    datos.stats[nombre] += cantidad;

    guardarDatos(datos);

    return datos.stats[nombre];
}

function obtenerEstadisticas() {
    return cargarDatos().stats;
}

/* =========================================================
   SERVIDORES
========================================================= */

function configuracionServidor(guildId) {
    const datos = cargarDatos();

    if (!datos.servers[guildId]) {
        datos.servers[guildId] = {
            idioma: "es",

            premium: null,

            tickets: {},

            configuracion: {},

            automod: {
                enabled: false,
                insultos: false,
                spam: false,
                links: false,
                invitaciones: false,
                palabras: [],
                accion: "eliminar"
            },

            uso: {
                ia: 0,
                imagenes: 0,
                tickets: 0
            }
        };

        guardarDatos(datos);
    }

    return datos.servers[guildId];
}

async function inicializarServidor(
    client,
    guild,
    datos
) {
    if (!datos.servers[guild.id]) {
        datos.servers[guild.id] = {
            idioma: "es",

            premium: null,

            tickets: {},

            configuracion: {},

            automod: {
                enabled: false,
                insultos: false,
                spam: false,
                links: false,
                invitaciones: false,
                palabras: [],
                accion: "eliminar"
            },

            uso: {
                ia: 0,
                imagenes: 0,
                tickets: 0
            }
        };

        guardarDatos(datos);
    }

    return datos.servers[guild.id];
}

/* =========================================================
   LOG GLOBAL
========================================================= */

async function logGlobal(
    client,
    titulo,
    descripcion,
    color = 0x5865f2,
    campos = []
) {
    try {
        const canal =
            await client.channels.fetch(
                GLOBAL_LOG_CHANNEL_ID
            ).catch(() => null);

        if (
            !canal ||
            !canal.isTextBased()
        ) {
            return;
        }

        await canal.send({
            embeds: [
                {
                    title: titulo,
                    description:
                        descripcion ||
                        undefined,
                    color,
                    fields: campos,
                    timestamp: new Date()
                }
            ]
        });
    } catch (error) {
        console.error(
            "❌ Error log global:",
            error.message
        );
    }
}

/* =========================================================
   PREMIUM
========================================================= */

const PLANES = {
    gratis: {
        nombre: "🆓 Gratis",
        ia: 100,
        imagenes: 3
    },

    basico: {
        nombre: "🥉 Básico",
        ia: 500,
        imagenes: 10
    },

    pro: {
        nombre: "🥈 Pro",
        ia: 2000,
        imagenes: 25
    },

    ultra: {
        nombre: "🥇 Ultra",
        ia: 5000,
        imagenes: 50
    }
};

function obtenerPremiumUsuario(userId) {
    const datos = cargarDatos();

    return (
        datos.premium.users[userId] ||
        null
    );
}

function obtenerPremiumServidor(guildId) {
    const datos = cargarDatos();

    return (
        datos.premium.servers[guildId] ||
        null
    );
}

function obtenerPlan(
    userId,
    guildId
) {
    const datos = cargarDatos();

    const usuario =
        datos.premium.users[userId];

    const servidor =
        datos.premium.servers[guildId];

    const ahora = Date.now();

    if (
        usuario &&
        (!usuario.expira ||
            new Date(
                usuario.expira
            ).getTime() > ahora)
    ) {
        return usuario.plan;
    }

    if (
        servidor &&
        (!servidor.expira ||
            new Date(
                servidor.expira
            ).getTime() > ahora)
    ) {
        return servidor.plan;
    }

    return "gratis";
}

function obtenerLimites(
    userId,
    guildId
) {
    const plan =
        obtenerPlan(
            userId,
            guildId
        );

    return (
        PLANES[plan] ||
        PLANES.gratis
    );
}

/* =========================================================
   ANTI-INSULTOS
========================================================= */

const INSULTOS = [
    "puta",
    "puto",
    "pendejo",
    "pendeja",
    "idiota",
    "estupido",
    "estupida",
    "imbecil",
    "cabron",
    "cabrona",
    "marica",
    "maricon",
    "mamon",
    "mamona",
    "mierda",
    "joder",
    "cono",
    "verga",
    "culo",
    "gilipollas",
    "hijueputa",
    "hijo de puta",
    "malparido",
    "malparida",
    "perra",
    "perro"
];

function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9\s]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

function contieneInsulto(texto) {
    const normalizado =
        normalizarTexto(texto);

    return INSULTOS.some(
        palabra =>
            normalizado === palabra ||
            normalizado.includes(
                ` ${palabra} `
            ) ||
            normalizado.startsWith(
                `${palabra} `
            ) ||
            normalizado.endsWith(
                ` ${palabra}`
            )
    );
}

/* =========================================================
   AUTOMOD
========================================================= */

function detectarAutoMod(
    texto,
    configuracion
) {
    if (
        !configuracion ||
        !configuracion.enabled
    ) {
        return null;
    }

    const normalizado =
        normalizarTexto(texto);

    if (
        configuracion.insultos &&
        contieneInsulto(texto)
    ) {
        return "insultos";
    }

    if (
        configuracion.invitaciones &&
        /discord\.gg\/|discord\.com\/invite\//i
            .test(texto)
    ) {
        return "invitaciones";
    }

    if (
        configuracion.links &&
        /https?:\/\/\S+/i.test(texto)
    ) {
        return "links";
    }

    if (
        Array.isArray(
            configuracion.palabras
        )
    ) {
        const encontrada =
            configuracion.palabras.find(
                palabra =>
                    palabra &&
                    normalizado.includes(
                        normalizarTexto(
                            palabra
                        )
                    )
            );

        if (encontrada) {
            return "palabras";
        }
    }

    return null;
}

async function ejecutarAutoMod(
    client,
    message,
    tipo,
    configuracion
) {
    try {
        if (
            configuracion.accion ===
            "eliminar"
        ) {
            if (
                message.deletable
            ) {
                await message.delete();
            }
        }

        sumarEstadistica(
            "moderations"
        );

        await logGlobal(
            client,
            "🛡️ AutoMod",
            `Se detectó una infracción de tipo **${tipo}**.`,
            0xed4245,
            [
                {
                    name: "👤 Usuario",
                    value:
                        `${message.author.tag} (${message.author.id})`
                },
                {
                    name: "🏠 Servidor",
                    value:
                        message.guild.name
                },
                {
                    name: "⚠️ Regla",
                    value: tipo
                }
            ]
        );

        return true;
    } catch (error) {
        console.error(
            "❌ Error AutoMod:",
            error.message
        );

        return false;
    }
}

/* =========================================================
   JERARQUÍA DE ROLES
========================================================= */

function puedeModerar(
    guild,
    miembro
) {
    const bot =
        guild.members.me;

    if (!bot) {
        return false;
    }

    if (
        !miembro ||
        !miembro.roles
    ) {
        return false;
    }

    return (
        bot.roles.highest.position >
        miembro.roles.highest.position
    );
}

/* =========================================================
   PROCESAR MENSAJE
========================================================= */

async function procesarMensaje(
    client,
    message,
    datos
) {
    if (
        !message ||
        message.author.bot
    ) {
        return;
    }

    if (!message.guild) {
        return;
    }

    sumarEstadistica(
        "messages"
    );

    datos =
        datos ||
        cargarDatos();

    const servidor =
        configuracionServidor(
            message.guild.id
        );

    /* -----------------------------------------
       AUTOMOD
    ----------------------------------------- */

    const tipoAutoMod =
        detectarAutoMod(
            message.content,
            servidor.automod
        );

    if (tipoAutoMod) {
        const ejecutado =
            await ejecutarAutoMod(
                client,
                message,
                tipoAutoMod,
                servidor.automod
            );

        if (ejecutado) {
            return;
        }
    }

    /* -----------------------------------------
       TRIGGER DE MILO
    ----------------------------------------- */

    const contenido =
        message.content.trim();

    let pregunta = null;

    const mencion =
        new RegExp(
            `^<@!?${client.user.id}>\\s*`,
            "i"
        );

    if (
        mencion.test(contenido)
    ) {
        pregunta =
            contenido.replace(
                mencion,
                ""
            ).trim();
    } else if (
        /^milo\s+/i.test(
            contenido
        )
    ) {
        pregunta =
            contenido
                .replace(
                    /^milo\s+/i,
                    ""
                )
                .trim();
    } else if (
        /^\?\s+/.test(contenido)
    ) {
        pregunta =
            contenido
                .replace(
                    /^\?\s+/,
                    ""
                )
                .trim();
    }

    if (!pregunta) {
        return;
    }

    /* -----------------------------------------
       IMAGEN
    ----------------------------------------- */

    if (
        /^(crea|crear|genera|generar|haz|hacer)\s+una\s+imagen/i
            .test(pregunta)
    ) {
        const prompt =
            pregunta
                .replace(
                    /^(crea|crear|genera|generar|haz|hacer)\s+una\s+imagen\s*/i,
                    ""
                )
                .trim();

        return generarImagen(
            client,
            message,
            prompt
        );
    }

    /* -----------------------------------------
       ADMINISTRACIÓN
    ----------------------------------------- */

    if (
        /^(crea|crear|elimina|eliminar|borra|borrar)\s+(un|una)\s+/i
            .test(pregunta)
    ) {
        const resultado =
            await procesarAdministracion(
                client,
                message,
                pregunta
            );

        if (resultado) {
            return;
        }
    }

    /* -----------------------------------------
       IA
    ----------------------------------------- */

    return responderConGroq(
        client,
        message,
        pregunta
    );
}

/* =========================================================
   GROQ
========================================================= */

async function responderConGroq(
    client,
    message,
    pregunta
) {
    if (!GROQ_API_KEY) {
        return message.reply(
            "❌ Milo IA no tiene configurada la API de Groq."
        );
    }

    const limite =
        obtenerLimites(
            message.author.id,
            message.guild.id
        );

    const datos =
        cargarDatos();

    datos.users[
        message.author.id
    ] ??= {
        uso: {
            ia: 0,
            imagenes: 0
        }
    };

    datos.users[
        message.author.id
    ].uso ??= {};

    datos.users[
        message.author.id
    ].uso.ia ??= 0;

    if (
        datos.users[
            message.author.id
        ].uso.ia >= limite.ia
    ) {
        return message.reply(
            `❌ Has alcanzado tu límite diario de IA (${limite.ia}).`
        );
    }

    try {
        await message.channel.sendTyping();

        const respuesta =
            await fetch(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${GROQ_API_KEY}`
                    },

                    body:
                        JSON.stringify({
                            model:
                                GROQ_MODEL,

                            messages: [
                                {
                                    role:
                                        "system",

                                    content:
                                        "Eres Milo IA, un asistente útil integrado en Discord. Responde en el idioma del usuario. Sé claro, preciso y natural. No reveles claves API, tokens ni información interna de configuración."
                                },

                                {
                                    role:
                                        "user",

                                    content:
                                        pregunta
                                }
                            ],

                            temperature:
                                0.7,

                            max_tokens:
                                2048
                        })
                }
            );

        const resultado =
            await respuesta.json();

        if (
            !respuesta.ok
        ) {
            console.error(
                "❌ Error Groq:",
                resultado
            );

            return message.reply(
                "❌ No pude obtener una respuesta de la IA en este momento."
            );
        }

        const texto =
            resultado
                ?.choices?.[0]
                ?.message
                ?.content;

        if (!texto) {
            return message.reply(
                "❌ Groq no devolvió una respuesta válida."
            );
        }

        datos.users[
            message.author.id
        ].uso.ia++;

        datos.stats.aiResponses++;

        guardarDatos(datos);

        await message.reply({
            content:
                texto.slice(
                    0,
                    4000
                )
        });

        await logGlobal(
            client,
            "🧠 Consulta IA",
            `Milo respondió una consulta de IA.`,
            0x5865f2,
            [
                {
                    name: "👤 Usuario",
                    value:
                        `${message.author.tag} (${message.author.id})`
                },
                {
                    name: "🏠 Servidor",
                    value:
                        message.guild.name
                }
            ]
        );
    } catch (error) {
        console.error(
            "❌ Error conectando con Groq:",
            error
        );

        await message.reply(
            "❌ Ocurrió un error al conectar con Milo IA."
        );
    }
}

/* =========================================================
   ADMINISTRACIÓN
========================================================= */

async function procesarAdministracion(
    client,
    message,
    texto
) {
    const miembro =
        message.member;

    if (!miembro) {
        return false;
    }

    if (
        !miembro.permissions.has(
            "ManageGuild"
        )
    ) {
        return false;
    }

    const guild =
        message.guild;

    /* -----------------------------------------
       CREAR CANAL
    ----------------------------------------- */

    const crearCanal =
        texto.match(
            /^(?:crea|crear)\s+(?:un|una)\s+canal\s+(?:llamado|llamada|de nombre)\s+(.+)$/i
        );

    if (crearCanal) {
        const nombre =
            crearCanal[1]
                .trim()
                .replace(
                     /\s+/g,
                    "-"
                )
                .toLowerCase();

        const canal =
            await guild.channels.create({
                name: nombre,
                reason:
                    `Creado por Milo a petición de ${message.author.tag}`
            });

        await message.reply(
            `✅ Canal creado: ${canal}`
        );

        await logGlobal(
            client,
            "⚙️ Administración",
            `Se creó el canal **${canal.name}**.`,
            0x57f287
        );

        return true;
    }

    /* -----------------------------------------
       CREAR CATEGORÍA
    ----------------------------------------- */

    const crearCategoria =
        texto.match(
            /^(?:crea|crear)\s+(?:una|un)\s+categor[ií]a\s+(?:llamada|llamado|de nombre)\s+(.+)$/i
        );

    if (crearCategoria) {
        const nombre =
            crearCategoria[1]
                .trim();

        const categoria =
            await guild.channels.create({
                name: nombre,
                type: 4,
                reason:
                    `Creada por Milo a petición de ${message.author.tag}`
            });

        await message.reply(
            `✅ Categoría creada: **${categoria.name}**`
        );

        await logGlobal(
            client,
            "⚙️ Administración",
            `Se creó la categoría **${categoria.name}**.`,
            0x57f287
        );

        return true;
    }

    /* -----------------------------------------
       CREAR ROL
    ----------------------------------------- */

    const crearRol =
        texto.match(
            /^(?:crea|crear)\s+(?:un|una)\s+rol\s+(?:llamado|llamada|de nombre)\s+(.+)$/i
        );

    if (crearRol) {
        const nombre =
            crearRol[1]
                .trim();

        const rol =
            await guild.roles.create({
                name: nombre,
                reason:
                    `Creado por Milo a petición de ${message.author.tag}`
            });

        await message.reply(
            `✅ Rol creado: ${rol}`
        );

        await logGlobal(
            client,
            "⚙️ Administración",
            `Se creó el rol **${rol.name}**.`,
            0x57f287
        );

        return true;
    }

    return false;
}

/* =========================================================
   INTERACCIONES
========================================================= */

async function procesarInteraccion(
    client,
    interaction,
    datos
) {
    if (
        interaction.isChatInputCommand()
    ) {
        return procesarComando(
            client,
            interaction,
            datos
        );
    }

    if (
        interaction.isButton()
    ) {
        return procesarBoton(
            client,
            interaction,
            datos
        );
    }

    if (
        interaction.isStringSelectMenu()
    ) {
        return procesarSelect(
            client,
            interaction,
            datos
        );
    }
}

/* =========================================================
   COMANDOS
========================================================= */

async function procesarComando(
    client,
    interaction,
    datos
) {
    const comando =
        interaction.commandName;

    if (
        comando === "estadisticas"
    ) {
        const stats =
            obtenerEstadisticas();

        return interaction.reply({
            embeds: [
                {
                    title:
                        "📊 Estadísticas de Milo IA",

                    color:
                        0x5865f2,

                    fields: [
                        {
                            name:
                                "🌐 Servidores",
                            value:
                                String(
                                    client.guilds.cache.size
                                ),
                            inline: true
                        },

                        {
                            name:
                                "💬 Mensajes",
                            value:
                                String(
                                    stats.messages
                                ),
                            inline: true
                        },

                        {
                            name:
                                "🧠 Respuestas IA",
                            value:
                                String(
                                    stats.aiResponses
                                ),
                            inline: true
                        },

                        {
                            name:
                                "🖼️ Imágenes",
                            value:
                                String(
                                    stats.images
                                ),
                            inline: true
                        },

                        {
                            name:
                                "🎫 Tickets",
                            value:
                                String(
                                    stats.tickets
                                ),
                            inline: true
                        },

                        {
                            name:
                                "🛡️ Moderaciones",
                            value:
                                String(
                                    stats.moderations
                                ),
                            inline: true
                        }
                    ]
                }
            ]
        });
    }

    if (
        comando === "premium"
    ) {
        return interaction.reply({
            embeds: [
                {
                    title:
                        "💎 Premium de Milo IA",

                    description:
                        "Milo IA dispone de tres planes Premium.",

                    color:
                        0xfee75c,

                    fields: [
                        {
                            name:
                                "🥉 Básico",
                            value:
                                "500 mensajes IA/día\n10 imágenes/día"
                        },

                        {
                            name:
                                "🥈 Pro",
                            value:
                                "2.000 mensajes IA/día\n25 imágenes/día"
                        },

                        {
                            name:
                                "🥇 Ultra",
                            value:
                                "5.000 mensajes IA/día\n50 imágenes/día"
                        }
                    ]
                }
            ],

            ephemeral: true
        });
    }

    if (
        comando === "imagen"
    ) {
        const prompt =
            interaction.options.getString(
                "descripcion"
            );

        if (!prompt) {
            return interaction.reply({
                content:
                    "❌ Debes indicar qué imagen quieres crear.",
                ephemeral: true
            });
        }

        return generarImagenDesdeInteraccion(
            client,
            interaction,
            prompt
        );
    }

    if (
        comando === "panel"
    ) {
        return crearPanel(
            client,
            interaction
        );
    }

    if (
        comando === "premium codigo"
    ) {
        return interaction.reply({
            content:
                "⚙️ El sistema de códigos Premium está preparado para conectarse.",
            ephemeral: true
        });
    }

    if (
        comando === "canjear"
    ) {
        return interaction.reply({
            content:
                "💎 El sistema de canje Premium está preparado para conectarse.",
            ephemeral: true
        });
    }
                          }

                          /* =========================================================
   IMÁGENES
========================================================= */

async function generarImagen(
    client,
    message,
    prompt
) {
    if (!prompt) {
        return message.reply(
            "❌ Describe la imagen que quieres crear."
        );
    }

    if (!IMAGE_API_KEY) {
        return message.reply(
            "❌ El sistema de imágenes todavía no tiene configurada su API."
        );
    }

    const limites =
        obtenerLimites(
            message.author.id,
            message.guild.id
        );

    const datos =
        cargarDatos();

    datos.users[
        message.author.id
    ] ??= {
        uso: {}
    };

    datos.users[
        message.author.id
    ].uso ??= {};

    datos.users[
        message.author.id
    ].uso.imagenes ??= 0;

    if (
        datos.users[
            message.author.id
        ].uso.imagenes >=
        limites.imagenes
    ) {
        return message.reply(
            `❌ Has alcanzado tu límite de imágenes (${limites.imagenes} por día).`
        );
    }

    /*
     * La API concreta de imágenes depende
     * del proveedor que se configure en
     * IMAGE_API_KEY / IMAGE_MODEL.
     */

    return message.reply(
        "🖼️ El sistema de imágenes está conectado al límite Premium, pero falta configurar el proveedor de generación de imágenes."
    );
}

async function generarImagenDesdeInteraccion(
    client,
    interaction,
    prompt
) {
    if (!IMAGE_API_KEY) {
        return interaction.reply({
            content:
                "❌ El sistema de imágenes no tiene configurada su API.",
            ephemeral: true
        });
    }

    return interaction.reply({
        content:
            `🖼️ Solicitud recibida: **${prompt}**\n\nEl proveedor de imágenes debe estar configurado en \`IMAGE_API_KEY\` y \`IMAGE_MODEL\`.`,
        ephemeral: true
    });
}

/* =========================================================
   TICKETS
========================================================= */

async function crearPanel(
    client,
    interaction
) {
    if (
        !interaction.guild
    ) {
        return interaction.reply({
            content:
                "❌ Este comando solo puede utilizarse dentro de un servidor.",
            ephemeral: true
        });
    }

    const descripcion =
        interaction.options.getString(
            "descripcion"
        );

    const rolSoporte =
        interaction.options.getRole(
            "rol_soporte"
        );

    const canal =
        interaction.options.getChannel(
            "canal"
        );

    if (
        !descripcion ||
        !rolSoporte ||
        !canal
    ) {
        return interaction.reply({
            content:
                "❌ Faltan datos para crear el panel.",
            ephemeral: true
        });
    }

    const opciones =
        analizarOpcionesPanel(
            descripcion
        );

    const embed = {
        title:
            "🎫 Soporte",

        description:
            descripcion,

        color:
            0x5865f2,

        footer: {
            text:
                "Milo IA"
        }
    };

    if (opciones.length) {
        const components = [
            {
                type: 1,

                components: [
                    {
                        type: 3,

                        custom_id:
                            "milo_ticket_select",

                        placeholder:
                            "Selecciona una opción",

                        options:
                            opciones
                                .slice(0, 25)
                                .map(
                                    opcion => ({
                                        label:
                                            opcion.nombre.slice(
                                                0,
                                                100
                                            ),

                                        value:
                                            opcion.nombre
                                                .toLowerCase()
                                                .replace(
                                                    /[^a-z0-9]+/g,
                                                    "_"
                                                )
                                                .slice(
                                                    0,
                                                    100
                                                )
                                    })
                                )
                    }
                ]
            }
        ];

        await canal.send({
            embeds: [embed],
            components
        });
    } else {
        await canal.send({
            embeds: [embed],

            components: [
                {
                    type: 1,

                    components: [
                        {
                            type: 2,

                            style: 1,

                            custom_id:
                                "milo_ticket_open",

                            label:
                                "Abrir ticket",

                            emoji: {
                                name:
                                    "🎫"
                            }
                        }
                    ]
                }
            ]
        });
    }

    sumarEstadistica(
        "tickets"
    );

    await interaction.reply({
        content:
            `✅ Panel enviado a ${canal}.`,
        ephemeral: true
    });

    await logGlobal(
        client,
        "🎫 Panel creado",
        `Se creó un panel de tickets en **${interaction.guild.name}**.`,
        0x5865f2,
        [
            {
                name:
                    "👤 Creado por",
                value:
                    interaction.user.tag
            },

            {
                name:
                    "🛡️ Rol de soporte",
                value:
                    rolSoporte.toString()
            }
        ]
    );
}

function analizarOpcionesPanel(
    descripcion
) {
    const resultado = [];

    const partes =
        descripcion
            .split(
                /(?:opciones|opción|opciones:|con las opciones)\s*/i
            )
            .pop();

    if (!partes) {
        return resultado;
    }

    const nombres =
        partes
            .split(
                /,|\s+o\s+|\s+y\s+/i
            )
            .map(
                x => x.trim()
            )
            .filter(
                x =>
                    x.length >= 2 &&
                    x.length <= 100
            );

    for (
        const nombre
        of nombres
    ) {
        if (
            !resultado.some(
                x =>
                    x.nombre
                        .toLowerCase() ===
                    nombre.toLowerCase()
            )
        ) {
            resultado.push({
                nombre
            });
        }
    }

    return resultado;
}

/* =========================================================
   BOTONES
========================================================= */

async function procesarBoton(
    client,
    interaction,
    datos
) {
    if (
        interaction.customId ===
        "milo_ticket_open"
    ) {
        return abrirTicket(
            client,
            interaction
        );
    }

    if (
        interaction.customId ===
        "milo_ticket_claim"
    ) {
        return interaction.reply({
            content:
                "🛡️ Ticket reclamado.",
            ephemeral: true
        });
    }

    if (
        interaction.customId ===
        "milo_ticket_close"
    ) {
        return cerrarTicket(
            interaction
        );
    }
}

/* =========================================================
   SELECT
========================================================= */

async function procesarSelect(
    client,
    interaction,
    datos
) {
    if (
        interaction.customId !==
        "milo_ticket_select"
    ) {
        return;
    }

    return abrirTicket(
        client,
        interaction,
        interaction.values[0]
    );
}

/* =========================================================
   ABRIR TICKET
========================================================= */

async function abrirTicket(
    client,
    interaction,
    tipo = "soporte"
) {
    const guild =
        interaction.guild;

    const usuario =
        interaction.user;

    const categoria =
        guild.channels.cache.find(
            canal =>
                canal.type === 4 &&
                canal.name ===
                    "「🎫」・TICKETS"
        );

    const datos =
        cargarDatos();

    const servidor =
        configuracionServidor(
            guild.id
        );

    const numero =
        Object.keys(
            servidor.tickets
        ).length + 1;

    const nombre =
        `ticket-${numero}`;

    const overwrites = [
        {
            id:
                guild.roles.everyone.id,

            deny: [
                "ViewChannel"
            ]
        },

        {
            id:
                usuario.id,

            allow: [
                "ViewChannel",
                "SendMessages",
                "ReadMessageHistory"
            ]
        }
    ];

    const canal =
        await guild.channels.create({
            name: nombre,

            type: 0,

            parent:
                categoria?.id,

            permissionOverwrites:
                overwrites
        });

    servidor.tickets[
        canal.id
    ] = {
        usuario:
            usuario.id,

        tipo,

        creado:
            new Date().toISOString()
    };

    datos.stats.tickets++;

    guardarDatos(datos);

    await canal.send({
        content:
            `${usuario}`,

        embeds: [
            {
                title:
                    "🎫 Ticket abierto",

                description:
                    "Un miembro del equipo de soporte te atenderá pronto.",

                color:
                    0x5865f2
            }
        ],

        components: [
            {
                type: 1,

                components: [
                    {
                        type: 2,

                        style: 2,

                        custom_id:
                            "milo_ticket_claim",

                        label:
                            "Reclamar",

                        emoji: {
                            name:
                                "🛡️"
                        }
                    },

                    {
                        type: 2,

                        style: 4,

                        custom_id:
                            "milo_ticket_close",

                        label:
                            "Cerrar",

                        emoji: {
                            name:
                                "❌"
                        }
                    }
                ]
            }
        ]
    });

    if (
        interaction.replied ||
        interaction.deferred
    ) {
        await interaction.followUp({
            content:
                `🎫 Ticket creado: ${canal}`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content:
                `🎫 Ticket creado: ${canal}`,
            ephemeral: true
        });
    }

    await logGlobal(
        client,
        "🎫 Ticket creado",
        `Se abrió un nuevo ticket en **${guild.name}**.`,
        0x5865f2,
        [
            {
                name:
                    "👤 Usuario",
                value:
                    usuario.tag
            },

            {
                name:
                    "📂 Tipo",
                value:
                    tipo
            }
        ]
    );
                              }

                               /* =========================================================
   CERRAR TICKET
========================================================= */

async function cerrarTicket(
    interaction
) {
    if (
        !interaction.channel
    ) {
        return;
    }

    await interaction.reply({
        content:
            "🔒 Cerrando ticket...",
        ephemeral: true
    });

    setTimeout(
        async () => {
            try {
                await interaction.channel.delete();
            } catch {}
        },
        1500
    );
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
    cargarDatos,
    guardarDatos,
    obtenerDatos,
    sumarEstadistica,
    obtenerEstadisticas,

    configuracionServidor,
    inicializarServidor,

    logGlobal,

    obtenerPremiumUsuario,
    obtenerPremiumServidor,
    obtenerPlan,
    obtenerLimites,

    contieneInsulto,
    detectarAutoMod,
    ejecutarAutoMod,
    puedeModerar,

    procesarMensaje,
    procesarInteraccion,

    responderConGroq,

    generarImagen,
    generarImagenDesdeInteraccion,

    crearPanel,
    abrirTicket,
    cerrarTicket
};
