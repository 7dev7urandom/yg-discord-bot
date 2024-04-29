/*
import { Message } from "discord.js";

const child_process = require('child_process');

let pythonExec = child_process.spawn('python3 expression.py');
pythonExec.stdout.on('data', (data) => {
    if(data.toString().startsWith('RES:')){
        if(data.toString().contains('True')){
            pending.execute();
        }
    }
});

function sendNext() {
    // pythonExec.stdin.write(`${message.content}\n`);
    if(queue.length > 0){
        queue.shift().checkMatches();
    }
}

export class PythonExpression {
    eval: string;
    exec: string;
    message: Message

    checkMatches(message: Message) {
        this.message = message;
        pythonExec.stdin.write('event:' + JSON.stringify({
            input: message.content,
            eval: this.eval,
            channelId: message.channel.id,
        }) + '\n');
        pending = this;
    }
    execute() {
        pythonExec.stdin.write('exec:' + JSON.stringify({
            eval: this.exec
        }) + '\n');
    }
}

let queue: PythonExpression[] = [];

let pending: PythonExpression;
*/
