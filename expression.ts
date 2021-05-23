export class Expression {
    expression: CallableFunction;
    static funcs: string[];

    constructor(value: string) {
        this.expression = new Function(...Expression.funcs, `return ` + value);
    }
    checkMatches(value: string) {
        return this.expression(...Expression.funcs.map(x => this[x].call(this, value)));
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
Expression.funcs = Object.getOwnPropertyNames(Expression.prototype).filter(name => name !== "constructor" && name !== "checkMatches");
