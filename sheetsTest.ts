import { readFileSync } from "fs";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { client, constants, events } from "./client";
import {
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
} from "discord.js";

const tokenData = JSON.parse(readFileSync("google-client-info.json", "utf8"));

const doc = new GoogleSpreadsheet(tokenData.doc_id);

doc.useServiceAccountAuth({
  client_email: tokenData.client_email,
  private_key: tokenData.private_key,
});

async function scheduleEventFromDoc() {
  await doc.loadInfo();
  console.log("LOADED DOC: " + doc.title);
  const sheet = doc.sheetsByTitle["2022 Schedule"];
  // console.log(await (await sheet.getRows()[1]));
  await sheet.loadCells({
    startColumnIndex: 0,
    startRowIndex: 0,
    endColumnIndex: sheet.columnCount,
    endRowIndex: sheet.rowCount,
  });
  ["Date", "Passage/Topic", "From", "To", "Host", "Bot parsed"].forEach(
    (header, i) => {
      if (sheet.getCell(1, i).value !== header) {
        throw new Error(
          `Header mismatch: ${sheet.getCell(1, i).value} !== ${header}`
        );
      }
    }
  );
  let y = 2;
  while (true) {
    if (sheet.getCell(y, 5).value !== null && sheet.getCell(y, 5).value !== "✓")
      throw new Error(
        "Unexpected value in `Bot parsed` field: " + sheet.getCell(y, 5).value
      );
    if (sheet.getCell(y, 5).value === null) {
      if (parseDateField(sheet.getCell(y, 0).value) < new Date()) {
        sheet.getCell(y, 5).value = "✓";
        // sheet.getCell(y, 5).save();
      } else {
        break;
      }
    }
    y++;
  }
  const date = parseDateField(sheet.getCell(y, 0).value);
  if (date.getTime() - Date.now() > 1000 * 60 * 60 * 24 * 7) {
    console.log(`Date ${date} is too far in the future`);
    return;
  }

  // Parse host, passage and time from the y row
  const host = sheet.getCell(y, 4).value;
  const passage = sheet.getCell(y, 1).value;
  const startTime = sheet.getCell(y, 2).value;
  const endTime = sheet.getCell(y, 3).value;
  if (
    !(typeof host === "string") ||
    !(typeof passage === "string") ||
    !(typeof startTime === "string") ||
    !(typeof endTime === "string")
  )
    throw new Error("Invalid data in row " + y);
  const startDate = parseTimeField(startTime, date);
  const endDate = parseTimeField(endTime, date);
  if (startDate.getTime() > endDate.getTime())
    throw new Error("Start time is after end time");

  console.log(
    `Adding event ${startDate} to ${endDate} at ${host} for ${passage}`
  );

  // Add event to discord
  if (
    await constants.mainGuild.scheduledEvents.create({
      entityType: GuildScheduledEventEntityType.External,
      name: "Youth Group",
      privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
      scheduledStartTime: startDate,
      scheduledEndTime: endDate,
      description: `We will be looking at ${passage}. Please join us!\nIf you need a location, please ask in the WhatsApp chat.`,
      entityMetadata: {
        location: `${host} home`,
      },
    })
  ) {
    sheet.getCell(y, 5).value = "✓";
    console.log("Event scheduled");
  } else {
    sheet.getCell(y, 5).value = "Error scheduling event";
    sheet.getCell(y, 5).save();
    throw new Error("Couldn't schedule event");
  }
  await sheet.saveUpdatedCells();
}

function parseTimeField(str, baseDate) {
  const match = /(\d{1,2})(?::(\d{2}))?\s*(am?|pm?)/.exec(str + "");
  if (!match) throw new Error("Couldn't parse time: " + str);
  const hour = match[3].startsWith("p")
    ? parseInt(match[1]) + 12
    : parseInt(match[1]);
  const date = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hour,
    parseInt(match[2] ?? "0"),
    0
  );
  return date;
}

function parseDateField(str) {
  const match = /(\w{3,10})\s(\d{1,2})\s\((\w{3})\)/.exec(str + "");
  if (!match) throw new Error("Couldn't parse date: " + str);
  const day = parseInt(match[2]);
  const month = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  }[match[1]];
  const dayOfWeek = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }[match[3]];
  if (
    !(
      typeof day === "number" &&
      typeof month === "number" &&
      typeof dayOfWeek === "number"
    )
  )
    throw new Error(
      `Date ${match[0]} is invalid: ${day}, ${month}, ${dayOfWeek}`
    );
  const year =
    new Date().getMonth() > month
      ? new Date().getFullYear() + 1
      : new Date().getFullYear();
  const date = new Date(year, month, day);
  if (date.getDay() !== dayOfWeek)
    throw new Error(`Date ${match[0]} is invalid: incorrect day of week`);
  return date;
}
export const run = async () => {
  try {
    await scheduleEventFromDoc();
  } catch (e) {
    await constants.logs.send({
      content: `Error scheduling event: ${e}`,
    });
  }
};
