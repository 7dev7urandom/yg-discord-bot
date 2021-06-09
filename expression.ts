import { Message, MessageEmbed, MessageEmbedOptions } from "discord.js";

export class BooleanExpression {
    expression: CallableFunction;
    static funcs: string[];

    constructor(value: string) {
        this.expression = new Function(...BooleanExpression.funcs, `return ` + value);
    }
    checkMatches(value: string) {
        return this.expression(...BooleanExpression.funcs.map(x => this[x].call(this, value)));
    }
    regex(value: string) {
        return regex => regex.test(value);
    }
    contain(value: string) {
        return test => value.includes(test);
    }
    not() {
        return value => !value;
    }
}
BooleanExpression.funcs = Object.getOwnPropertyNames(BooleanExpression.prototype).filter(name => name !== "constructor" && name !== "checkMatches");

export class ActionExpression {
    expression: CallableFunction;
    static funcs: string[];

    constructor(value: string) {
        this.expression = new Function(...ActionExpression.funcs, value);
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
