import { Message, MessageEmbed, MessageEmbedOptions } from "discord.js";

export class BooleanExpression {
    expression: CallableFunction;
    static funcs: string[];

    constructor(value: string) {
        this.expression = new Function(...BooleanExpression.funcs, `return ` + value);
    }
    checkMatches(value: Message) {
        return this.expression(...BooleanExpression.funcs.map(x => this[x].call(this, value)));
    }
    regex(value: Message) {
        return regex => regex.content.test(value);
    }
    contain(value: Message) {
        return test => value.content.includes(test);
    }
    not() {
        return value => !value;
    }
    inChannel(value: Message) {
        return channelId => value.channel.id === channelId;
    }
}
BooleanExpression.funcs = Object.getOwnPropertyNames(BooleanExpression.prototype).filter(name => name !== "constructor" && name !== "checkMatches");

const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
export class ActionExpression {
    expression: CallableFunction;
    static funcs: string[];

    constructor(value: string) {
        this.expression = new AsyncFunction(...ActionExpression.funcs, value);
    }
    execute(value: Message) {
        return this.expression(...ActionExpression.funcs.map(x => this[x].call(this, value)));
    }
    testExecute() {
        return this.expression(...ActionExpression.funcs.map(_ => _ === "delay" ? this[_].call(this) : () => {}));
    }
    deleteOriginal(value: Message) {
        return () => value.delete();
    }
    react(value: Message) {
        return reaction => value.react(reaction);
    }
    send(value: Message) {
        return text => value.channel.send(text);
    }
    sendEmbed(value: Message) {
        return (data: MessageEmbedOptions) => value.channel.send(new MessageEmbed(data));
    }
    delay(value: Message) {
        return (delay: number) => new Promise(r => setTimeout(r, delay));
    }
}
ActionExpression.funcs = Object.getOwnPropertyNames(ActionExpression.prototype).filter(name => name !== "constructor" && name !== "execute" && name !== "testExecute");
