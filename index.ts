import { Client, MessageAttachment, ChannelLogsQueryOptions, Message, MessageEmbed, TextChannel, Guild, Intents, User } from 'discord.js'; 
import { get } from 'https';
import { readFileSync } from 'fs';
import { Database } from 'sqlite3';

let bibleVerseChannel;

let responses = [
    "Stop bullying me"
];

const db = new Database('dmresponses.db', (err) => {
    if (err) throw err;
    console.log("Got db");
});
db.run(`CREATE TABLE IF NOT EXISTS responses (value TEXT PRIMARY KEY)`);

db.serialize(() => {
    db.all(`SELECT value FROM responses`, [], (err, rows) => {
        if(err) throw err;
        responses = rows.map(r => r.value);
        if(responses.length == 0) {
            responses = [
                "Stop bullying me",
                "What do you want",
                "https://www.youtube.com/watch/dQw4w9WgXcQ",
                "Micah is epic",
                "What are you humans doing to the earth :(",
                "99 days, 15 hours and 13 minutes until Operation X is begun",
                "Wouldn't you just like to know",
                "ummmmmmmm idk",
                "Ask the stars",
                "Ooh I have admin permissions! Cool!",
            ];
            
            db.run(`INSERT INTO responses (value) VALUES ${responses.map(_ => '(?)').join(',')}`, responses, err => {
                if(err) throw err;
            });
        }
    });
});

const blogId = '767695352144461825';
const bibleVerseId = '762664099825451039';
const bibleVerseAdminId = '767737683560366080';

const client = new Client({
    ws: {
        intents: new Intents([
            Intents.NON_PRIVILEGED,
            "GUILD_MEMBERS",
            "GUILD_PRESENCES"
        ])
    }
});
try{

    client.once('ready', async () => {
        console.log("Client ready!");
        mainGuild = client.guilds.cache.get('762299189290991616'); // Youth Group
        const x = mainGuild?.channels.resolve('782854127520579607');
        if (x) (<TextChannel> await x.fetch()).send("YG bot loaded");
        logs = <TextChannel> await client.channels.fetch('823825055736922115');
    });
    var messageJson: any = {};
    var mainGuild: Guild | undefined;
    var logs: TextChannel;

    client.on('messageDelete', async message => {
        if(message.guild !== mainGuild) return;
    
        const logMessage = new MessageEmbed()
            .setTitle("Message deleted in #" + (<TextChannel>message.channel).name)
            .setAuthor(message.author?.username + '#' + message.author?.discriminator, message.author?.avatarURL())
            .setDescription(message.content)
            .setTimestamp(message.createdTimestamp)
            .setColor('#de6053')
            .setFooter("ID: " + message.id);
            logs.send(logMessage);
    });

    client.on("message", async message => {
        // console.log("message: " + message.content);
        if(message.channel.id === bibleVerseAdminId) {
            const collected = await message.awaitReactions((reaction, user) => {
                const member = mainGuild.members.cache.get(user.id);
                return member.hasPermission("ADMINISTRATOR") && reaction.emoji.name === "✅" && !user.bot;
            }, { max: 1 });
            if(!collected.size) return;
            if(message.embeds.length) {
                // Bot message
                (client.channels.cache.get(bibleVerseId) as TextChannel).send(message.embeds[0]);
            } else {
                // Manual override not implemented
            }
            return;
        }
        if(message.author.bot) return;

        if(mainGuild.roles.cache.get('829658046149033985').members.get(message.author.id) && message.channel.type == 'dm' && message.content.startsWith('!')) {
            if(message.content.startsWith("!responses")) {
                const desc = [];
                responses.forEach((value, i) => {
                    desc.push((i + '').padEnd(5, ' ') + " | " + value);
                });
                const embed = new MessageEmbed()
                .setTitle('Current responses')
                .setDescription("Index | Text\n" + desc.join('\n'));
                message.channel.send(embed);
            } else if (message.content.startsWith("!addres")) {
                const newResponse = message.content.substring(8);
                responses.push(newResponse);
                message.channel.send("Added response \"" + newResponse + "\"");
                db.run(`INSERT INTO responses (value) VALUES (?)`, [newResponse]);
            } else if (message.content.startsWith('!remres')) {
                const index = parseInt(message.content.substring(8));
                if(!index) message.channel.send("Error: Invalid value " + message.content.substring(8));
                if(index >= responses.length) {
                    message.channel.send("Error: Index out of range 0-" + (responses.length - 1));
                    return;
                }
                const embed = new MessageEmbed()
                .setTitle('Response deleted')
                .setDescription("Text: " + responses[index]);
                message.channel.send(embed);
                db.run(`DELETE FROM responses WHERE value in (SELECT value FROM responses WHERE value=(?) LIMIT 1)`, [responses[index]], function(err) {
                    if (err) throw err;
                });
                responses.splice(index, 1);
            } else {
                message.channel.send(message.content.split(' ')[0] + " is not a valid command. Valid commands are: !responses, !addres, and !remres");
            }
            return;
        }
        if(message.channel.type == 'dm' && message.author.id !== '694538295010656267') { // Don't respond if the author is Asia
            message.channel.send(responses[Math.floor(Math.random() * responses.length)]);
        }

        // if(!(message.guild === mainGuild )) return;
        if(message.content.startsWith("!export")) {
            if (message.member?.roles.cache.has('762592153393692682')) {
                message.channel.send(`Message export requested by ${message.member?.displayName}. Messages exporting!`);
                
                var keepGoing = true;
                var totalMessages = 0;
                var lastMessage: Message | null = null;
                var prevLastMessage: Message | null = null;
                messageJson = {};
                while(keepGoing) {
                    var config: ChannelLogsQueryOptions = {};
                    if(lastMessage) {
                        if (lastMessage === prevLastMessage) break;
                        config.before = lastMessage['id'] || undefined;
                        prevLastMessage = lastMessage;
                    }
                    console.log("lastMessage is " + lastMessage + " and config is " + JSON.stringify(config));
                    const messages = await message.channel.messages.fetch({ limit: 100 });
                        console.log("this many messages: " + messages.array().length);
                        var currentMessageCount = 0;
                        messages.forEach(message => {
                            currentMessageCount++;
                            totalMessages++;

                            lastMessage = message;
                            if(messageJson[message.createdAt.toDateString()] === undefined) {
                                // We don't have any data saved for today
                                messageJson[message.createdAt.toDateString()] = {};
                                if(message.member?.displayName) {
                                    messageJson[message.createdAt.toDateString()][message.member?.displayName] = 1;
                                } else {
                                    console.log("Wrong context! Skipping...");
                                    return;
                                }
                            } else if (messageJson[message.createdAt.toDateString()][message.member?.displayName || "null"] === undefined) {
                                // Do we have anything for this user yet?
                                if(message.member?.displayName) {
                                    if(messageJson[message.createdAt.toDateString()][message.member?.displayName] === undefined) {
                                        messageJson[message.createdAt.toDateString()][message.member?.displayName] = 1;
                                    } else {
                                        messageJson[message.createdAt.toDateString()][message.member?.displayName]++;
                                    }
                                }
                            }
    
                            if(messageJson[message.createdAt.toDateString()][message.member?.displayName || "null"]) {
                                messageJson[message.createdAt.toDateString()][message.member?.displayName || "null"]++;
                            } else {
                                messageJson[message.createdAt.toDateString()][message.member?.displayName || "null"] = 1;
                            }
                        });
                        if (currentMessageCount < 100) keepGoing = false;
                        currentMessageCount = 0;
                }
                messageJson = {};
                message.channel.messages.cache.forEach(message => {

                    console.log(`MessageJson: ${JSON.stringify(messageJson)}`);
                    // lastMessage = message;
                    if(messageJson[message.createdAt.toDateString()] === undefined) {
                        // We don't have any data saved for today
                        messageJson[message.createdAt.toDateString()] = {};
                        if(message.member?.displayName) {
                            messageJson[message.createdAt.toDateString()][message.member?.displayName] = 1;
                        } else {
                            console.log("Wrong context! Skipping...");
                            return;
                        }
                    } else if (messageJson[message.createdAt.toDateString()][message.member?.displayName || "null"] === undefined) {
                        // Do we have anything for this user yet?
                        if(message.member?.displayName) {
                            if(messageJson[message.createdAt.toDateString()][message.member?.displayName] === undefined) {
                                messageJson[message.createdAt.toDateString()][message.member?.displayName] = 1;
                            } else {
                                messageJson[message.createdAt.toDateString()][message.member?.displayName]++;
                            }
                        }
                    }
    
                    if(messageJson[message.createdAt.toDateString()][message.member?.displayName || "null"]) {
                        messageJson[message.createdAt.toDateString()][message.member?.displayName || "null"]++;
                    } else {
                        messageJson[message.createdAt.toDateString()][message.member?.displayName || "null"] = 1;
                    }
                });
                // if (currentMessageCount < 100) keepGoing = false;
                // currentMessageCount = 0;
                console.log("---------------- " + JSON.stringify(messageJson));
                const buf = Buffer.from(JSON.stringify(messageJson));
                const attachment = new MessageAttachment(buf, "messages.json");
                message.channel.send("Export complete! Here is the data", attachment);
            } else {
                message.reply("Sorry, only Administrators can use this feature.")
            }
        } else if (message.content.startsWith("!suggestnick ")) {
            const nick = message.content.replace("!suggestnick ", "");
            const embed = new MessageEmbed()
                .setAuthor(message.member.displayName, message.author.avatarURL())
                .setDescription("**" + nick + "**\n\nReact with :ballot_box_with_check: to vote. 7 votes required to change")
                .setTitle("Nickname suggestion");
            const msg = await message.channel.send(embed);
            await msg.react("☑️");
            // const fjdsk = 0;
            const reacted = new Set<any>();
            await msg.awaitReactions((reaction, user) => {
                if(reaction.emoji.name !== "☑️") return false;
                if(reacted.has(user.id)) return false;
                reacted.add(user.id);
                return true;
            }, { max: 6 });
		    msg.channel.send(`Changing nickname to ${nick}!`);
            msg.member.setNickname(nick);
        } else if (message.content.startsWith('!purge')) {
            if(!message.member?.hasPermission('MANAGE_MESSAGES')) {
                message.reply("You do not have permission to do that!");
                return;
            };
            let split = message.content.split(' ');
            split.shift();
            if (split.length == 1 && split[0] == "all") {
                if(!message.member.hasPermission('ADMINISTRATOR')) {
                    message.reply("Only administrators can clear whole channels!");
                    return;
                }
                const channel = message.channel;
                let messages;
                while((await channel.messages.fetch()).array().length > 0) {
                    (<TextChannel> channel).bulkDelete(100);
                }
                message.reply("All messages have been purged!");
                return;
            }
            let num;
            if(!isNaN(parseInt(split[0]))) {
                num = parseInt(split[0]) + 1;
                (<TextChannel> message.channel).bulkDelete(num);
                message.reply("Deleted " + num + " messages!");
                return;
            }
            let user = getUserFromMention(split[0])
            if(user) {
                message.reply("This has not been implemented yet. Sorry!");
                return;
                if(split.length > 1) {
                    num = parseInt(split[1]);
                } else {
                    num = 100;
                }
     
                return;
            }
            message.reply("Missing parameter. Syntax: `!purge <<numberOfMessages>|<username>|all> [numberOfMessages]`");
        } else if (message.content.startsWith("!endit")) {
            message.channel.send(new MessageEmbed().setAuthor("Clem", 'https://cdn.discordapp.com/avatars/708155649455816785/a803bf4737f4dec2ada1e6b0517e3b61.webp')
                .setDescription("End of convo"));
            message.delete();
        } else if (message.content.startsWith("!stats")) {
            message.channel.send(`Do Not Disturb: ${message.guild.members.cache.filter(x => x.presence.status === 'dnd').size}\n` +
                                 `Online: ${message.guild.members.cache.filter(x => x.presence.status === 'online').size - 1}\n` + 
                                 `Idle: ${message.guild.members.cache.filter(x => x.presence.status === 'idle').size}`);
        }
    });

    
    let currentNumOfPostsMSG: number;
    let currentNumOfPostsAsia: number;
    
    setInterval(() => {
        get('https://public-api.wordpress.com/rest/v1.1/sites/familystudents.family.blog/posts?offset=0&number=1', async res => {currentNumOfPostsMSG = await handleBlog(res, currentNumOfPostsMSG, "MSG students")})
            .on('err', (err) => console.error("Error getting wordpress for MSG: " + err)).end();
        get('https://public-api.wordpress.com/rest/v1.1/sites/asiawritescreatively.wordpress.com/posts?offset=0&number=1', async res => {currentNumOfPostsAsia = await handleBlog(res, currentNumOfPostsAsia, "Rhino Riders Ramblings")})
            .on('err', (err) => console.error("Error getting wordpress for RhinoRidersRamblings: " + err)).end();
    }, 5000);
    // setInterval(() => {
    //     get('https://www.biblegateway.com/votd/get/?format=json&version=esv', async res => {
    //         let data = '';
    //         res.on('data', (d) => {data += d});
    //         res.on('end', async () => {
    //             try {

    //                 const json = JSON.parse(data);
    //                 const verse = json.votd.text
    //             }
    //         })
    //     });
    // }, 60000)
    
    const token = JSON.parse(readFileSync('./config.json').toString('utf-8')).token;
    client.login(token);
    console.log("Authen with token: " + token);
} catch (e) {
    // Error, exit with error so systemctl will restart
    console.error(e);
    process.exit(111);
}
function getUserFromMention(mention: string) {
    if (!mention) return;

    if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        if (mention.startsWith('!')) {
            mention = mention.slice(1);
        }

        return client.users.cache.get(mention);
    }
}
function handleBlog(res, count, siteName): Promise<number> {
    // console.log("begin " + count);
    return new Promise((resolve, reject) => {
        let datastr = '';
        res.on('data', chunk => datastr += chunk);

        res.on('end', async () => {
            let data = JSON.parse(datastr);
            if(!count) {
                count = data.found;

                resolve(count);
                return;
            }
            if(data.found > count) {

                let desc: string = data.posts[0].excerpt;
                desc = desc.replace("<p>", "").replace("</p>", "").replace(/\[&\w+;\]/g, "").replace("\n", "");
                // desc = decodeURIComponent(desc);
                desc = decodeEntities(desc).trim() + "...";
                

                const embed = new MessageEmbed()
                    .setTitle(siteName + " post: " + decodeEntities(data.posts[0].title))
                    .setAuthor(data.posts[0].author.name, data.posts[0].author.avatar_URL)
                    .setDescription(desc)
                    .setTimestamp(new Date(data.posts[0].date))
                    .setColor('#0000aa')
                    .setFooter(data.posts[0].URL)
                    .setImage(data.posts[0].featured_image)
//                              http://familystudents.family.blog/2020/11/05/vergesssen/
                    .setFooter("Automatically detected by a bot. Please report any issues")
                    .setURL(data.posts[0].URL);
                (<TextChannel> await client.channels.cache.get(blogId)?.fetch()).send(embed);
                count = data.found;
                resolve(count);
            }

        });
        // console.log("3 " + count);
        // return count;
        // ).on('err', (err) => console.error("Error getting wordpress: " + err));
    });
}
function decodeEntities(encodedString) {
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
        "nbsp":" ",
        "amp" : "&",
        "quot": "\"",
        "lt"  : "<",
        "gt"  : ">"
    };
    return encodedString.replace(translate_re, function(match, entity) {
        return translate[entity];
    }).replace(/&#(\d+);/gi, function(match, numStr) {
        var num = parseInt(numStr, 10);
        return String.fromCharCode(num);
    });
}
client.on('error', (error) => {
    console.error(error.message);
});
