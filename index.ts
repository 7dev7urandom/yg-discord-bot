// Dear programmer:
// When I wrote this code, only God and
// I knew how it worked.
// Now, only God knows it!
// 
// Therefore, if you are trying to optimize
// this routine and it fails (most surely),
// please increase this counter as a
// warning for the next person:
// 
// total hours wasted here = 82
//

import { Client, MessageAttachment, ChannelLogsQueryOptions, Message, MessageEmbed, TextChannel, Guild, Intents, User, MessageReaction, Collection } from 'discord.js'; 
import { get } from 'https';
import { readFileSync } from 'fs';
import { Database } from 'sqlite3';
import { ActionExpression, BooleanExpression, PythonActionExpression, PythonBooleanExpression } from './expression';
import { IncomingMessage } from 'http';
    
let currentNumOfPostsMSG: number;
let currentNumOfPostsAsia: number;

let responses = [
    "Stop bullying me"
];

let expressions: Map<BooleanExpression, ActionExpression> = new Map();
let pyExpressions: Map<PythonBooleanExpression, PythonActionExpression> = new Map();

let lastStats: number = 0;

const db = new Database('dmresponses.db', (err) => {
    if (err) throw err;
    console.log("Got db");
});
db.run(`CREATE TABLE IF NOT EXISTS responses (value TEXT PRIMARY KEY)`);
// db.run(`DROP TABLE triggers`);
db.run(`CREATE TABLE IF NOT EXISTS triggers (id INTEGER PRIMARY KEY AUTOINCREMENT, expression TEXT, response TEXT)`);

db.run(`CREATE TABLE IF NOT EXISTS pytriggers (id INTEGER PRIMARY KEY AUTOINCREMENT, expression TEXT, response TEXT)`);

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
    db.all(`SELECT * FROM triggers`, [], (err, rows) => {
        if(err) throw err;
        expressions = new Map(rows.map(r => [new BooleanExpression(r.expression), new ActionExpression(r.response)]));
    });
    db.all(`SELECT * FROM pytriggers`, [], (err, rows) => {
        if(err) throw err;
        pyExpressions = new Map(rows.map(r => [new PythonBooleanExpression(r.expression), new PythonActionExpression(r.response)]));
    });
});

import { bibleVerseAdminId, bibleVerseId, blogId, botChannelId, client, constants } from "./client";

try{
    var messageJson: any = {};
    client.on('messageReactionAdd', async (reaction) => {
        let reactiondone: MessageReaction;
        if(reaction.emoji.name === 'this1') {
            reaction.remove();
            reactiondone = await reaction.message.react(reaction.message.guild.emojis.cache.find(e => e.name === 'this'));
            await reaction.message.awaitReactions({ filter: (reaction) => reaction.emoji.name === 'this', max: 1, time: 10000 });
            reactiondone.users.remove(client.user);
        }
    })
    client.on('messageDelete', async message => {
        if(message.guild !== constants.mainGuild) return;
    
        const logMessage = new MessageEmbed()
            .setTitle("Message deleted in #" + (<TextChannel>message.channel).name)
            .setAuthor({ name: message.author.username + '#' + message.author.discriminator, iconURL: message.author.avatarURL() })
            // .setAuthor(message.author?.username + '#' + message.author?.discriminator, message.author?.avatarURL())
            .setDescription(message.content)
            .setTimestamp(message.createdTimestamp)
            .setColor('#de6053')
            .setFooter({ text: "ID: " + message.id });
        constants.logs.send({ embeds: [logMessage], files: Array.from(message.attachments.values()) });
    });

    client.on("messageCreate", async message => {
        if(message.channel.id === bibleVerseAdminId) {
            const collected = await message.awaitReactions({ filter: (reaction, user) => {
                const member = constants.mainGuild.members.cache.get(user.id);
                return member.permissions.has("ADMINISTRATOR") && reaction.emoji.name === "✅" && !user.bot;
            }, max: 1 });
            if(!collected.size) return;
            if(message.embeds.length) {
                // Bot message
                (client.channels.cache.get(bibleVerseId) as TextChannel).send({ embeds: [message.embeds[0]] });
            } else {
                // Manual override not implemented
            }
            return;
        }
        if(message.author.bot) return;

        if(constants.mainGuild.roles.cache.get('829658046149033985').members.get(message.author.id) && (message.channel.type === 'DM' || message.channel.id === botChannelId) && message.content.startsWith('!')) {
            if(message.content.startsWith("!responses")) {
                const desc = [];
                responses.forEach((value, i) => {
                    desc.push((i + '').padEnd(5, ' ') + " | " + value);
                });
                const embed = new MessageEmbed()
                .setTitle('Current responses')
                .setDescription("Index | Text\n" + desc.join('\n'));
                message.channel.send({ embeds: [embed]});
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
                message.channel.send({ embeds: [embed]});
                db.run(`DELETE FROM responses WHERE value in (SELECT value FROM responses WHERE value=(?) LIMIT 1)`, [responses[index]], function(err) {
                    if (err) throw err;
                });
                responses.splice(index, 1);
            } else if (message.content.startsWith("!addtrigger")) {
                const expr = message.content.substring("!addtrigger ".length);
                let func: BooleanExpression;
                try {
                    func = new BooleanExpression(expr);
                    // const test = new Message(client, {}, message.channel);
                    // test.content = "test";
                    func.checkMatches(message);
                } catch (e) {
                    message.channel.send("There was an error with that expression: " + e);
                    return;
                }
                message.channel.send("What should I do?");
                let responseMessage;
                try {
                    responseMessage = await message.channel.awaitMessages({ filter: (m) => {
                        // console.log(m, author);
                        return m.author.id === message.author.id
                    }, max: 1, time: 60000, errors: ['time']});
                } catch {
                    message.channel.send("Too slow! Canceling");
                    return;
                }
                const text = responseMessage.get(responseMessage.firstKey());
                let resultFunc: ActionExpression;
                try {
                    resultFunc = new ActionExpression(text.content);
                    resultFunc.testExecute();
                } catch (e) {
                    message.channel.send("There was an error with that expression: " + e);
                    return;
                }
                expressions.set(func, resultFunc);
                db.run(`INSERT INTO triggers (expression, response) VALUES (?, ?)`, [expr, text.content], (err) => {
                    if(err) throw err;
                });
            } else if(message.content.startsWith("!listtrigger")) {
                db.all(`SELECT * FROM triggers`, (err, result) => {
                    if(err) throw err;
                    message.channel.send({ embeds: [new MessageEmbed()
                        .setDescription(result.map(r => `${r.id} | ${r.expression} | ${r.response}`).join("\n"))
                        .setTitle("All triggers")]});
                });
            } else if (message.content.startsWith("!remtrigger")) {
                const id = parseInt(message.content.substring("!remtrigger ".length));
                if(isNaN(id)) {
                    message.channel.send("Not a number: " + id);
                    return;
                }
                db.run(`DELETE FROM triggers WHERE id=(?)`, [id], () => {
                    message.react("✅");
                });
                db.all(`SELECT * FROM triggers`, [], (err, rows) => {
                    if(err) throw err;
                    expressions = new Map(rows.map(r => [new BooleanExpression(r.expression), new ActionExpression(r.response)]));
                });
            } else if (message.content.startsWith("!addpytrigger")) {
                const expr = message.content.substring("!addpytrigger ".length);
                if(expr.length === 0) {
                    message.channel.send("Give me an actual expression, idiot");
                    return;
                }
                let func: PythonBooleanExpression;
                try {
                    func = new PythonBooleanExpression(expr);
                    // const test = new Message(client, {}, message.channel);
                    // test.content = "test";
                    func.execute(message);
                } catch (e) {
                    message.channel.send("There was an error with that expression: " + e);
                    return;
                }
                message.channel.send("What should I do?");
                let responseMessage;
                try {
                    responseMessage = await message.channel.awaitMessages({ filter: (m) => {
                        // console.log(m, author);
                        return m.author.id === message.author.id
                    }, max: 1, time: 60000, errors: ['time']});
                } catch {
                    message.channel.send("Too slow! Canceling");
                    return;
                }
                const text = responseMessage.get(responseMessage.firstKey());
                const match = /```(?:py(?:thon)?)?([\w\W]*)```/.exec(text.content);
                let resultFunc: PythonActionExpression;
                const action = text.content.startsWith('```') ? (match ? match[1] : text.content) : text.content;
                try {
                    resultFunc = new PythonActionExpression(action);
                    resultFunc.execute(message);
                } catch (e) {
                    message.channel.send("There was an error with that expression: " + e);
                    return;
                }
                pyExpressions.set(func, resultFunc);
                db.run(`INSERT INTO pytriggers (expression, response) VALUES (?, ?)`, [expr, action], (err) => {
                    if(err) throw err;
                });
            } else if(message.content.startsWith("!listpytrigger")) {
                db.all(`SELECT * FROM pytriggers`, (err, result) => {
                    if(err) throw err;
                    message.channel.send({ embeds: [new MessageEmbed()
                        .setDescription(result.map(r => `${r.id}: ${r.expression}\`\`\`py\n${r.response}\n\`\`\``).join("\n"))
                        .setTitle("All python triggers")]});
                });
            } else if (message.content.startsWith("!rempytrigger")) {
                const id = parseInt(message.content.substring("!rempytrigger ".length));
                if(isNaN(id)) {
                    message.channel.send("Not a number: " + id);
                    return;
                }
                db.run(`DELETE FROM pytriggers WHERE id=(?)`, [id], () => {
                    message.react("✅");
                });
                db.all(`SELECT * FROM pytriggers`, [], (err, rows) => {
                    if(err) throw err;
                    pyExpressions = new Map(rows.map(r => [new PythonBooleanExpression(r.expression), new PythonActionExpression(r.response)]));
                });
            } else {
                message.channel.send(message.content.split(' ')[0] + " is not a valid command. Valid commands are: !responses, !addres, !remres, !listtrigger, !remtrigger, !addtrigger, !listpytrigger, !rempytrigger, !addpytrigger");
            }
            return;
            
        }
        if(message.channel.type === 'DM' && message.author.id !== '694538295010656267') { // Don't respond if the author is Asia
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
                        console.log("this many messages: " + messages.size);
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
                message.channel.send({ content: "Export complete! Here is the data", files: [attachment] });
            } else {
                message.reply("Sorry, only Administrators can use this feature.")
            }
        } else if (message.content.startsWith("!suggestnick ")) {
            const nick = message.content.replace("!suggestnick ", "");
            const embed = new MessageEmbed()
                .setAuthor(message.member.displayName, message.author.avatarURL())
                .setDescription("**" + nick + "**\n\nReact with :ballot_box_with_check: to vote. 7 votes required to change")
                .setTitle("Nickname suggestion");
            const msg = await message.channel.send({ embeds: [embed]});
            await msg.react("☑️");
            // const fjdsk = 0;
            const reacted = new Set<any>();
            await msg.awaitReactions({ filter: (reaction, user) => {
                if(reaction.emoji.name !== "☑️") return false;
                if(reacted.has(user.id)) return false;
                reacted.add(user.id);
                return true;
            }, max: 6 });
		    msg.channel.send(`Changing nickname to ${nick}!`);
            msg.member.setNickname(nick);
        } else if (message.content.startsWith('!purge')) {
            if(!message.member?.permissions.has('MANAGE_MESSAGES')) {
                message.reply("You do not have permission to do that!");
                return;
            };
            const allMessages = new Collection<string, Message>();
            let split = message.content.split(' ');
            split.shift();
            if (split.length == 1 && split[0] == "all") {
                if(!message.member.permissions.has('ADMINISTRATOR')) {
                    message.reply("Only administrators can clear whole channels!");
                    return;
                }
                const channel = message.channel;
                let messages: Collection<string, Message> = new Collection();
                // while((await channel.messages.fetch()).array().length > 0) {
                // await channel.messages.fetch();
                while((messages = await (<TextChannel> channel).bulkDelete(100, true)).size >= 100) {
                    messages.forEach(message => {
                        allMessages.set(message.id, message);
                    });
                }
                messages.forEach(message => {
                    allMessages.set(message.id, message);
                });
                message.reply("All messages have been purged!");
            }
            else if(!isNaN(parseInt(split[0]))) {
                let num;
                num = parseInt(split[0]) + 1;
                const messages = await (<TextChannel> message.channel).bulkDelete(num, true);
                message.reply("Deleted " + messages.size + " messages!");
                return;
            }
            else if(getUserFromMention(split[0])) {
                message.reply("This has not been implemented yet. Sorry!");
                return;
                // if(split.length > 1) {
                //     num = parseInt(split[1]);
                // } else {
                //     num = 100;
                // }
     
                // return;
            } else {
                message.reply("Missing parameter. Syntax: `!purge <<numberOfMessages>|<username>|all> [numberOfMessages]`");
                return;
            }
            const allMessageString = allMessages.sort((m1, m2) => m1.createdTimestamp - m2.createdTimestamp).map(message => "**" + message.author?.username + "**: " + message.content).join("\n");
            const allAttachments = allMessages.map(message => Array.from(message.attachments.values())).flat();
            const logMessage = new MessageEmbed()
                .setTitle("Bulk messages deleted in #" + (<TextChannel>message.channel).name)
                .setAuthor(message.author?.username + '#' + message.author?.discriminator, message.author?.avatarURL())
                .setDescription(allMessageString)
                .setTimestamp(message.createdTimestamp)
                .setColor('#de6053')
                .setFooter("ID: " + message.id);
                constants.logs.send({ embeds: [logMessage], files: allAttachments });
        } else if (message.content.startsWith("!endit")) {
            message.channel.send({ embeds: [new MessageEmbed().setAuthor({name: "Clem", iconURL: 'https://cdn.discordapp.com/avatars/708155649455816785/a803bf4737f4dec2ada1e6b0517e3b61.webp' })
                .setDescription("End of convo")]});
            message.delete();
        } else if (message.content.startsWith("!stats")) {
            if(lastStats > Date.now() - 1000 * 30) return;
            lastStats = Date.now();
            message.channel.send(`Do Not Disturb: ${message.guild.members.cache.filter(x => x.presence.status === 'dnd').size}\n` +
                                 `Online: ${message.guild.members.cache.filter(x => x.presence.status === 'online').size - 1}\n` + 
                                 `Idle: ${message.guild.members.cache.filter(x => x.presence.status === 'idle').size}`);
        } else {
            expressions.forEach((res, key) => {
                if(key.checkMatches(message)) res.execute(message);
            });
            pyExpressions.forEach((res, key) => {
                try {
                    // const x = key.execute(message);
                    // // console.log(x);
                    // if(await x) res.execute(message);
                    key.execute(message).then(x => x ? res.execute(message) : null);
                } catch (e) {
                    (message.guild.channels.cache.get(botChannelId) as TextChannel).send("@<494009206341369857> there was an error parsing python expression " + key.expression + ": " + e);
                }
            });
        }
    });

    
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
function handleBlog(res: IncomingMessage, count: number, siteName: string): Promise<number> {
    // console.log("begin " + count);
    return new Promise((resolve, reject) => {
        let datastr = '';
        res.on('data', chunk => datastr += chunk);

        res.on('end', async () => {
            let data: any;
            try {
                data = JSON.parse(datastr);
            } catch (e) {
                console.log("Error parsing JSON for blog " + siteName + " with text " + datastr.substring(0, 100) + ": " + e);
                resolve(siteName === "MSG students" ? currentNumOfPostsMSG : currentNumOfPostsAsia);
                return;
            }
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
                (<TextChannel> await client.channels.cache.get(blogId)?.fetch()).send({ embeds: [embed]});
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
