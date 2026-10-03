const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const BANS_FILE = path.join(DATA_DIR, "bans.json");

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(BANS_FILE)) {
        fs.writeFileSync(
            BANS_FILE,
            JSON.stringify({ bans: {} }, null, 2),
            "utf8"
        );
    }
}

function readBans() {
    ensureDataFile();

    try {
        const data = fs.readFileSync(BANS_FILE, "utf8");
        const parsed = JSON.parse(data);

        if (!parsed.bans || typeof parsed.bans !== "object") {
            parsed.bans = {};
        }

        return parsed;
    } catch {
        return { bans: {} };
    }
}

function saveBans(data) {
    ensureDataFile();

    fs.writeFileSync(
        BANS_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function banUser(userId, reason, permanent, duration = null) {
    const data = readBans();

    data.bans[userId] = {
        userId,
        reason,
        permanent: Boolean(permanent),
        duration: permanent ? null : duration,
        bannedAt: new Date().toISOString()
    };

    saveBans(data);

    return data.bans[userId];
}

function getBan(userId) {
    const data = readBans();

    return data.bans[userId] || null;
}

function isBanned(userId) {
    const ban = getBan(userId);

    if (!ban) return false;

    if (ban.permanent) return true;

    if (!ban.duration) return true;

    const expiresAt = new Date(ban.duration).getTime();

    if (Date.now() >= expiresAt) {
        unbanUser(userId);
        return false;
    }

    return true;
}

function unbanUser(userId) {
    const data = readBans();

    if (!data.bans[userId]) {
        return false;
    }

    delete data.bans[userId];

    saveBans(data);

    return true;
}

function getAllBans() {
    const data = readBans();

    return data.bans;
}

module.exports = {
    banUser,
    getBan,
    isBanned,
    unbanUser,
    getAllBans
};
