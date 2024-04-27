import { REST, Routes } from "discord.js";
import { token, clientId } from "./config.json";
import { data } from "./commands/utility/ping";

const rest = new REST().setToken(token);
(async () => {
  try {
    console.log("Adding commands");
    const dataout = (await rest.put(Routes.applicationCommands(clientId), {
      body: [data.toJSON()],
    })) as unknown[];
    console.log("Success (" + dataout.length + " commands added!)");
  } catch (e) {
    console.error(e);
  }
})();
