const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const CONFIG_FILE = path.join(DATA_DIR, "configs.json");

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(
            CONFIG_FILE,
            JSON.stringify({ configs: {} }, null, 2),
            "utf8"
        );
    }
}

function readConfigs() {
    ensureDataFile();

    try {
        const data = fs.readFileSync(CONFIG_FILE, "utf8");
        const parsed = JSON.parse(data);

        if (!parsed.configs || typeof parsed.configs !== "object") {
            parsed.configs = {};
        }

        return parsed;
    } catch {
        return { configs: {} };
    }
}

function saveConfigs(data) {
    ensureDataFile();

    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function getConfig(guildId) {
    const data = readConfigs();

    return data.configs[guildId] || null;
}

function createConfig(guildId) {
    const data = readConfigs();

    if (!data.configs[guildId]) {
        data.configs[guildId] = {
            guildId,
            staffRoleId: null,
            categoryId: null,
            logsChannelId: null,
            panels: [],
            createdAt: new Date().toISOString()
        };

        saveConfigs(data);
    }

    return data.configs[guildId];
}

function updateConfig(guildId, changes) {
    const data = readConfigs();

    if (!data.configs[guildId]) {
        createConfig(guildId);
    }

    data.configs[guildId] = {
        ...data.configs[guildId],
        ...changes,
        updatedAt: new Date().toISOString()
    };

    saveConfigs(data);

    return data.configs[guildId];
}

function resetConfig(guildId) {
    const data = readConfigs();

    if (!data.configs[guildId]) {
        return false;
    }

    delete data.configs[guildId];

    saveConfigs(data);

    return true;
}

module.exports = {
    getConfig,
    createConfig,
    updateConfig,
    resetConfig
};
