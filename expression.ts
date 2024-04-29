import { Message, EmbedBuilder, TextChannel, EmbedData } from "discord.js";
import { py, python } from "pythonia";

export class BooleanExpression {
  expression: CallableFunction;
  static funcs: string[];

  constructor(value: string) {
    this.expression = new Function(
      ...BooleanExpression.funcs,
      `return ` + value,
    );
  }
  checkMatches(value: Message) {
    return this.expression(
      ...BooleanExpression.funcs.map((x) => this[x].call(this, value)),
    );
  }
  regex(value: Message) {
    return (regex) => regex.test(value.content);
  }
  contain(value: Message) {
    return (test) => value.content.includes(test);
  }
  not() {
    return (value) => !value;
  }
  inChannel(value: Message) {
    return (channelId) => value.channel.id === channelId;
  }
}
BooleanExpression.funcs = Object.getOwnPropertyNames(
  BooleanExpression.prototype,
).filter((name) => name !== "constructor" && name !== "checkMatches");

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
export class ActionExpression {
  expression: (...ActionExpression) => Promise<void>;
  static funcs: string[];

  constructor(value: string) {
    this.expression = new AsyncFunction(...ActionExpression.funcs, value);
  }
  execute(value: Message) {
    return this.expression(
      ...ActionExpression.funcs.map((x) => this[x].call(this, value)),
    );
  }
  testExecute() {
    return this.expression(
      ...ActionExpression.funcs.map((_) =>
        _ === "delay" ? this[_].call(this) : () => {},
      ),
    );
  }
  deleteOriginal(value: Message) {
    return () => value.delete();
  }
  react(value: Message) {
    return (reaction) => value.react(reaction);
  }
  send(value: Message) {
    return (text) => value.channel.send(text);
  }
  sendEmbed(value: Message) {
    return (data: EmbedData) =>
      value.channel.send({ embeds: [new EmbedBuilder(data)] });
  }
  delay(value: Message) {
    return (delay: number) => new Promise((r) => setTimeout(r, delay));
  }
}
ActionExpression.funcs = Object.getOwnPropertyNames(
  ActionExpression.prototype,
).filter(
  (name) =>
    name !== "constructor" && name !== "execute" && name !== "testExecute",
);

let pyFuncs;
(async () => {
  // await console.log(py(`__import__('expression').x()`));
  // console.log(await python('./expression.py'));
  // await py('print(3)');
  pyFuncs = await python("./expression.py");
  // new PythonActionExpression('x').execute('test' as unknown as Message)
})();

export class PythonActionExpression {
  static funcs: string[];
  expression: string;

  constructor(value: string) {
    this.expression = value;
  }
  async execute(value: Message) {
    pyFuncs.setMessage(value);
    const actions: string[] = await pyFuncs.executeBlock(this.expression);
    await PythonActionExpression.applyActions(value, actions);
  }
  static async applyActions(value: Message, actions: string[]) {
    for await (const action of actions) {
      const terms = action.split(" ");
      if (!PythonActionExpression[terms[0]])
        throw new Error(`Unknown action ${terms[0]}`);
      PythonActionExpression[terms.shift()](value, ...terms);
    }
  }
  static print(value: Message, ...args: string[]) {
    value.channel.send(args.join(" "));
  }
  static deleteOriginal(value: Message) {
    value.delete();
  }
  static react(value: Message, reaction: string) {
    value.react(reaction);
  }
  static async createWaitable(value: Message, functionIdstr: string) {
    const functionId = parseInt(functionIdstr);
    // value.channel.awaitMessages(() => {}, )
    let wait;
    let res: [boolean, string[]] = [true, []];
    while (await res[0]) {
      try {
        wait = await value.channel.awaitMessages({
          filter: (m) => !m.author.bot,
          max: 1,
          time: 30000,
          errors: ["time"],
        });
        res = await pyFuncs.executeWaitable(functionId, wait.first());
      } catch (e) {
        // if((e as Error).message.includes('*** PY ***'))
        value.channel.send(
          "Internal python error. I've sent more info to 7dev",
        );
        (
          value.guild.channels.cache.get("782854127520579607") as TextChannel
        ).send(
          `Python error with message in ${
            (value.channel as TextChannel).name
          }\n\`\`\`${e}\`\`\``,
        );
        pyFuncs.waitableTimeout(functionId);
        return;
      }
      await PythonActionExpression.applyActions(wait.first(), await res[1]);
    }
  }
}

export class PythonBooleanExpression {
  static funcs: string[];
  expression: string;

  constructor(value: string) {
    this.expression = value;
  }

  async execute(value: Message) {
    pyFuncs.setMessage(value);
    return await pyFuncs.executeExpression(this.expression);
  }
}
