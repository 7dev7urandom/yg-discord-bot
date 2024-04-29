import { Interaction, SlashCommandBuilder } from "discord.js";

let lastStats: number = 0;

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("Print number of people online and dnd");
export async function execute(interaction) {
  if (lastStats > Date.now() - 1000 * 30) return;
  lastStats = Date.now();
  const onlineUsers = interaction.guild.members.cache.filter(
    (x) => x.presence !== null,
  );
  interaction.reply(
    `Do Not Disturb: ${
      onlineUsers.filter((x) => x.presence.status === "dnd").size
    }\n` +
      `Online: ${
        onlineUsers.filter((x) => x.presence.status === "online").size - 1
      }\n` +
      `Idle: ${onlineUsers.filter((x) => x.presence.status === "idle").size}`,
  );
}
