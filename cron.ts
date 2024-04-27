import { EmbedBuilder, TextChannel } from "discord.js";
import { get } from "https";
import { promises } from "fs";
import { client, events } from "./client";
// import { run } from './sheetsTest';

const apiHeaders = {
  Authorization: "Token ",
};

async function getData(link: string, headers?: any): Promise<string> {
  return new Promise((r) => {
    get(
      link,
      {
        headers,
      },
      (res) => {
        let datastr = "";
        res.on("data", (chunk) => (datastr += chunk));
        res.on("end", () => r(datastr));
      }
    ).end();
  });
}

async function getVerse() {
  /*    const res = await getData('https://www.bible.com/verse-of-the-day');
    const regexmatcher = res.match(/<p class="usfm fw7 mt0 mb0 gray f7 ttu">(.*?) \([A-Za-z]{3}\)<\/p>/);
    if(!regexmatcher) {
	    console.error("Error: regexmatcher is ", regexmatcher, res);
	    process.exit(1);
    }
    const element = regexmatcher[1];
    const [_, book, chapter, verse] = element.match(/((?:\d )?\w+) (\d+):(\d+)/);
    console.log(`Book: ${book} Chapter: ${chapter} Verse: ${verse}`);
//    const json = JSON.parse(await getData(`https://api.esv.org/v3/passage/text/?include-headings=false&include-verse-numbers=false&include-footnotes=false&include-short-copyright=false&include-passage-references=false&q=${book.replace(/ /g, '+')}+${chapter}:${verse}`, apiHeaders));
*/
  const json = JSON.parse(
    await getData(
      `https://www.biblegateway.com/votd/get/?format=json&version=esv`
    )
  );
  return json.votd;
}

const localRun = async () => {
  const channel = await client.channels.fetch("767737683560366080");
  const thing = await getVerse();
  const embed = new EmbedBuilder()
    .setTitle(thing.reference.replace(/,.*/, "") + " (ESV)")
    .setDescription(
      (thing.content as string)
        .replace(/<h\d>.*<\/h\d>/g, "")
        .replace(/&.*?;/g, "")
        .replace(/<span class="small-caps" >Lord<\/span>/g, "Lord")
        .trim()
    )
    .setColor([255, 0, 0])
    .setURL(thing.permalink.replace(/,.*/, "") + "&version=ESV");
  await (await (channel as TextChannel).send({ embeds: [embed] })).react("✅");
  // process.exit();
};
promises.readFile("./config.json").then((x) => {
  const config = JSON.parse(x.toString("utf-8"));
  apiHeaders.Authorization += config.esvtoken;
  // client.login(config.token);
});
events.on("ready", async () => {
  await Promise.all([localRun()]);
  process.exit();
});
