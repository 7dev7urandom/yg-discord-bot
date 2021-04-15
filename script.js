const { Client } = require('discord.js'); 

const client = new Client();

// client.on('message', (message) => {
//     if(!(message.channel.type == 'dm' && message.author.id == '694538295010656267')) return;
//     (await message.channel.messages.fetch()).forEach((message, id) => {
//         console.log(message.author.username + ": " + message.content);
//     });
//     process.exit();
// })

client.login('NzgyODUwNDM2MDQ2NjUxNDAy.X8SMSA.rXtcvmAprR-4dk_jqrEcRgLtxDU').then(async () => {
    const user = await client.channels.fetch('762299189290991622');
    user.send("Stats:\nHenry is alcoholic: 2\nHenry is not an alcoholic: 1");
    // console.log(JSON.stringify(user));
    // const messages = await user.dmChannel.messages.fetch();
    // messages.forEach((message, id) => {
    //     console.log(message.author.username + ": " + message.content);
    // });
});

