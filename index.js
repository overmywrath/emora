require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ActivityType
} = require("discord.js");

const fs = require("fs");

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    process.exit(1);
}

const KICKS_FILE = "./kicks.json";
const BANS_FILE = "./bans.json";
const DISABLED_FILE = "./disabled.json";

let kickHistory = {};
let globalBans = {};
let disabledGuilds = {};

function loadFile(file) {
    if (!fs.existsSync(file)) return {};

    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return {};
    }
}

kickHistory = loadFile(KICKS_FILE);
globalBans = loadFile(BANS_FILE);
disabledGuilds = loadFile(DISABLED_FILE);

function saveFile(file, data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 4)
    );
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

function isEmma(member) {
    const username = member.user.username?.toLowerCase() || "";
    const globalName = member.user.globalName?.toLowerCase() || "";
    const displayName = member.displayName?.toLowerCase() || "";

    return (
        username === "emma" ||
        globalName === "emma" ||
        displayName === "emma"
    );
}

async function globallyBanUser(user) {
    globalBans[user.id] = {
        username: user.username,
        addedAt: Date.now()
    };

    saveFile(BANS_FILE, globalBans);

    for (const guild of client.guilds.cache.values()) {
        if (disabledGuilds[guild.id]) {
            continue;
        }

        try {
            const member = await guild.members
                .fetch(user.id)
                .catch(() => null);

            if (member) {
                if (
                    member.id === guild.ownerId ||
                    !member.bannable
                ) {
                    continue;
                }

                await member.ban({
                    reason: "global ban: user is named emma"
                });
            }

            const owner = await guild.fetchOwner();

            await owner.send(
                `hey, a user: \`@${user.username} - ${user.id}\` has been banned from your server: \`${guild.name}\` - this is because the user is a bad emma!`
            );
        } catch {
        }
    }
}

async function globallyUnbanUser(user) {
    delete globalBans[user.id];

    saveFile(BANS_FILE, globalBans);

    for (const guild of client.guilds.cache.values()) {
        try {
            await guild.bans.remove(
                user.id,
                "global ban removed"
            );
        } catch {
        }
    }
}

async function checkGlobalBan(member) {
    if (!member) return;

    if (!globalBans[member.user.id]) {
        return;
    }

    if (disabledGuilds[member.guild.id]) {
        return;
    }

    if (member.id === member.guild.ownerId) {
        return;
    }

    if (!member.bannable) {
        return;
    }

    try {
        await member.ban({
            reason: "global ban: user is named emma"
        });

        const owner = await member.guild.fetchOwner();

        await owner.send(
            `hey, a user: \`@${member.user.username} - ${member.user.id}\` has been banned from your server: \`${member.guild.name}\` - this is because the user is proven to be named emma.`
        );
    } catch {
    }
}

async function checkMember(member) {
    if (!member) return;

    await checkGlobalBan(member);

    if (disabledGuilds[member.guild.id]) {
        return;
    }

    if (!isEmma(member)) {
        return;
    }

    const botMember = member.guild.members.me;

    if (!botMember) return;

    if (member.user.id === member.guild.ownerId) {
        return;
    }

    if (member.user.id === botMember.user.id) {
        return;
    }

    if (
        !botMember.permissions.has(
            PermissionsBitField.Flags.KickMembers
        )
    ) {
        return;
    }

    if (!member.kickable) {
        return;
    }

    const key = `${member.guild.id}:${member.user.id}`;
    const previousKicks = kickHistory[key] || 0;

    let message;

    if (previousKicks === 0) {
        message =
            `you're about to get kicked from the server: \`${member.guild.name}\` for having \`emma\` on your username`;
    } else if (previousKicks === 1) {
        message =
            "you can join back by changing ur name, lol";
    } else {
        message =
            "dude, change your name and i'll stop kicking you 😭";
    }

    try {
        await member.send(message);
    } catch {
    }

    try {
        await member.kick(
            "emwilt: username or display name is emma"
        );

        kickHistory[key] = previousKicks + 1;

        saveFile(KICKS_FILE, kickHistory);
    } catch {
    }
}

client.once("ready", async () => {
    client.user.setPresence({
        activities: [
            {
                name: "kick anyone named emma",
                type: ActivityType.Custom
            }
        ],
        status: "dnd"
    });

    for (const guild of client.guilds.cache.values()) {
        try {
            const members = await guild.members.fetch();

            for (const member of members.values()) {
                await checkMember(member);
            }
        } catch {
        }
    }
});

client.on("guildMemberAdd", async member => {
    await checkMember(member);
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (
        oldMember.user.username !== newMember.user.username ||
        oldMember.user.globalName !== newMember.user.globalName ||
        oldMember.displayName !== newMember.displayName
    ) {
        await checkMember(newMember);
    }
});

client.login(TOKEN);
