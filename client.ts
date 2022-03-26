import { Client, Guild, Intents, TextChannel } from "discord.js";
import EventEmitter = require("events");
import { readFileSync } from "fs";

export const blogId = '767695352144461825';
export const bibleVerseId = '762664099825451039';
export const bibleVerseAdminId = '767737683560366080';
export const botChannelId = '782854127520579607';
export const constants: {
    mainGuild?: Guild,
    logs?: TextChannel
} = {};

export const client = new Client({
    intents: new Intents([
        "GUILD_MEMBERS",
        "GUILD_PRESENCES",
        "GUILDS",
        "GUILD_MESSAGES",
        "DIRECT_MESSAGES",
        "GUILD_MESSAGE_REACTIONS",
        "GUILD_SCHEDULED_EVENTS",
        "GUILD_PRESENCES"
    ])
});
export const events = new EventEmitter();
try {
    client.once('ready', async () => {
        console.log("Client ready!");
        constants.mainGuild = client.guilds.cache.get('762299189290991616'); // Youth Group
        client.channels.fetch('823825055736922115').then(x => {
            constants.logs = x as TextChannel;
            events.emit("ready");
        });    
    });
    const token = JSON.parse(readFileSync('./config.json').toString('utf-8')).token;
    client.login(token);
    console.log("Authen with token: " + token);
} catch (e) {
    console.error("Error: ", e);
}