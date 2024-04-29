import { REST, Routes } from "discord.js";
import { token, clientId } from "./config.json";
import * as ping from "./commands/utility/ping";
import * as stats from "./commands/utility/stats";

const rest = new REST().setToken(token);
(async () => {
  try {
    console.log("Adding commands");
    const dataout = (await rest.put(Routes.applicationCommands(clientId), {
      body: [ping.data.toJSON(), stats.data.toJSON()],
    })) as unknown[];
    console.log("Success (" + dataout.length + " commands added!)");
  } catch (e) {
    console.error(e);
  }
})();
