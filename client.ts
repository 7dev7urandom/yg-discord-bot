import {
  Client,
  Collection,
  Guild,
  IntentsBitField,
  Partials,
  TextChannel,
} from "discord.js";
import EventEmitter = require("events");
import { readFileSync } from "fs";
import {
  createAudioResource,
  createAudioPlayer,
  joinVoiceChannel,
} from "@discordjs/voice";
import { execute } from "./commands/utility/ping";
import { token } from "./config.json";

export const blogId = "767695352144461825";
export const bibleVerseId = "762664099825451039";
export const bibleVerseAdminId = "767737683560366080";
export const botChannelId = "782854127520579607";
export const constants: {
  mainGuild?: Guild;
  logs?: TextChannel;
} = {};

export const client = new Client({
  intents: [
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.DirectMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildScheduledEvents,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});
export const events = new EventEmitter();
try {
  client.once("ready", async () => {
    console.log("Client ready!");
    constants.mainGuild = client.guilds.cache.get("762299189290991616"); // Youth Group
    client.channels.fetch("823825055736922115").then((x) => {
      constants.logs = x as TextChannel;
      events.emit("ready");
      // const vChannelId = '1091372470445027400';
      // const vChannel = joinVoiceChannel({
      //     channelId: vChannelId,
      //     guildId: '823825055736922112',
      //     adapterCreator: constants.logs.guild.voiceAdapterCreator as any
      // });
      // const audioPlayer = createAudioPlayer();
      // const resource = createAudioResource('urmom.mp3');
      // audioPlayer.on("stateChange", (oldState, newState) => {
      //     if (newState.status === "idle") {
      //         // leave the channel
      //         vChannel.disconnect();
      //     }
      // });
      // vChannel.subscribe(audioPlayer);
      // client.on("voiceStateUpdate", (oldState, newState) => {
      //     if (newState.channelId === vChannelId) {
      //         audioPlayer.play(resource);
      //     } else if (oldState.channelId === vChannelId && newState.channelId === null && oldState.channel.members.size === 0) {
      //         vChannel.rejoin();
      //     }
      // });
    });
  });
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === "ping") {
      try {
        await execute(interaction);
      } catch (e) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "Error executing the command!",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "Error executing the command!",
            ephemeral: true,
          });
        }
      }
    }
  });
  client.login(token);
  console.log("Authen with token: " + token);
} catch (e) {
  console.error("Error: ", e);
}
