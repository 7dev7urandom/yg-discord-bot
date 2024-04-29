# yg-discord-bot

A discord bot that runs on the Youth Group discord server.

All relevant code is in the [index.ts](index.ts) file.

To run the bot, you need a `config.json` containing your bot token.

```json
{
  "token": "your-token"
}
```

Then compile the typescript into javascript and run with node.js

You can run the [cron.ts](cron.ts) file once a day to send a votd in a specified channel with a token also in `config.json`.
