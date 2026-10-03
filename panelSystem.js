// panelSystem.js

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const PANELS_FILE = path.join(DATA_DIR, "panels.json");

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(PANELS_FILE)) {
        fs.writeFileSync(
            PANELS_FILE,
            JSON.stringify({ panels: {} }, null, 2),
            "utf8"
        );
    }
}

function readPanels() {
    ensureDataFile();

    try {
        const data = fs.readFileSync(PANELS_FILE, "utf8");
        const parsed = JSON.parse(data);

        if (!parsed.panels || typeof parsed.panels !== "object") {
            parsed.panels = {};
        }

        return parsed;
    } catch (error) {
        return { panels: {} };
    }
}

function savePanels(data) {
    ensureDataFile();

    fs.writeFileSync(
        PANELS_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function createPanel(guildId, panel) {
    const data = readPanels();

    if (!data.panels[guildId]) {
        data.panels[guildId] = {};
    }

    const panelId = panel.id;

    data.panels[guildId][panelId] = {
        ...panel,
        guildId,
        createdAt: new Date().toISOString()
    };

    savePanels(data);

    return data.panels[guildId][panelId];
}

function getPanel(guildId, panelId) {
    const data = readPanels();

    return data.panels[guildId]?.[panelId] || null;
}

function getGuildPanels(guildId) {
    const data = readPanels();

    return data.panels[guildId] || {};
}

function updatePanel(guildId, panelId, changes) {
    const data = readPanels();

    if (!data.panels[guildId]?.[panelId]) {
        return null;
    }

    data.panels[guildId][panelId] = {
        ...data.panels[guildId][panelId],
        ...changes,
        updatedAt: new Date().toISOString()
    };

    savePanels(data);

    return data.panels[guildId][panelId];
}

function deletePanel(guildId, panelId) {
    const data = readPanels();

    if (!data.panels[guildId]?.[panelId]) {
        return false;
    }

    delete data.panels[guildId][panelId];

    if (Object.keys(data.panels[guildId]).length === 0) {
        delete data.panels[guildId];
    }

    savePanels(data);

    return true;
}

module.exports = {
    createPanel,
    getPanel,
    getGuildPanels,
    updatePanel,
    deletePanel
};
