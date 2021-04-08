const { Client } = require('discord.js'); 

const client = new Client();

client.on('message', async (message) => {
    if(!(message.channel.type == 'dm' && message.author.id == '710696257768652802')) return;
    (await message.channel.messages.fetch()).forEach((message, id) => {
        console.log(message.author.username + ": " + message.content);
    });
    process.exit();
})

client.login('NzgyODUwNDM2MDQ2NjUxNDAy.X8SMSA.rXtcvmAprR-4dk_jqrEcRgLtxDU')
/*
	.then(async () => {
    const user = await client.users.fetch('694538295010656267');
    console.log(JSON.stringify(user));
    const messages = await user.dmChannel.messages.fetch();
    messages.forEach((message, id) => {
        console.log(message.author.username + ": " + message.content);
    });
});
*/
