const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const TICKETS_FILE = path.join(DATA_DIR, "tickets.json");

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(TICKETS_FILE)) {
        fs.writeFileSync(
            TICKETS_FILE,
            JSON.stringify({ tickets: {} }, null, 2),
            "utf8"
        );
    }
}

function readTickets() {
    ensureDataFile();

    try {
        const data = fs.readFileSync(TICKETS_FILE, "utf8");
        const parsed = JSON.parse(data);

        if (!parsed.tickets || typeof parsed.tickets !== "object") {
            parsed.tickets = {};
        }

        return parsed;
    } catch {
        return { tickets: {} };
    }
}

function saveTickets(data) {
    ensureDataFile();

    fs.writeFileSync(
        TICKETS_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function createTicket(ticket) {
    const data = readTickets();

    data.tickets[ticket.id] = {
        ...ticket,
        createdAt: new Date().toISOString()
    };

    saveTickets(data);

    return data.tickets[ticket.id];
}

function getTicket(ticketId) {
    const data = readTickets();

    return data.tickets[ticketId] || null;
}

function getTickets() {
    const data = readTickets();

    return data.tickets;
}

function updateTicket(ticketId, changes) {
    const data = readTickets();

    if (!data.tickets[ticketId]) {
        return null;
    }

    data.tickets[ticketId] = {
        ...data.tickets[ticketId],
        ...changes,
        updatedAt: new Date().toISOString()
    };

    saveTickets(data);

    return data.tickets[ticketId];
}

function deleteTicket(ticketId) {
    const data = readTickets();

    if (!data.tickets[ticketId]) {
        return false;
    }

    delete data.tickets[ticketId];

    saveTickets(data);

    return true;
}

function getUserTickets(userId) {
    const data = readTickets();

    return Object.values(data.tickets).filter(
        ticket => ticket.userId === userId
    );
}

function getGuildTickets(guildId) {
    const data = readTickets();

    return Object.values(data.tickets).filter(
        ticket => ticket.guildId === guildId
    );
}

module.exports = {
    createTicket,
    getTicket,
    getTickets,
    updateTicket,
    deleteTicket,
    getUserTickets,
    getGuildTickets
};
