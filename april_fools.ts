import { Client, IntentsBitField } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
} from "@discordjs/voice";
import { readFileSync } from "fs";
const { token } = JSON.parse(readFileSync("config.json", "utf8"));

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildVoiceStates,
  ],
});

client.on("ready", async () => {
  console.log("Ready!");
  const vChannelId = "895626680507461682";
  let vChannel = joinVoiceChannel({
    channelId: vChannelId,
    guildId: "762299189290991616",
    adapterCreator: (await client.guilds.fetch("762299189290991616")!)
      .voiceAdapterCreator as any,
  });
  const audioPlayer = createAudioPlayer();
  vChannel.subscribe(audioPlayer);
  client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState.member.user.bot) return; // ignore bots (including the bot itself)
    if (newState.channelId === vChannelId) {
      setTimeout(() => {
        console.log("playing");
        const resource = createAudioResource("urmom.mp3");
        audioPlayer.play(resource);
      }, 2000);
    } else if (
      oldState.channelId === vChannelId &&
      newState.channelId === null &&
      oldState.channel.members.size === 0
    ) {
      console.log("rejoining");
      vChannel = joinVoiceChannel({
        channelId: vChannelId,
        guildId: "762299189290991616",
        adapterCreator: (await client.guilds.fetch("762299189290991616")!)
          .voiceAdapterCreator as any,
      });
      vChannel.subscribe(audioPlayer);
    }
  });
  audioPlayer.on("stateChange", (oldState, newState) => {
    if (newState.status === "idle") {
      // leave the channel
      vChannel.disconnect();
    }
  });
});

client.login(token);
