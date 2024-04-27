import { Interaction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Say Pong!");
export async function execute(interaction) {
  await interaction.reply("Pong!");
}
