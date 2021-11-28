# import time
# import json

# currentText = ''

# while True:
#     inputvalue = input("")
#     # print(f'X{inputvalue.split(":", 1)[1]}X')
#     jsonvalue = json.loads(inputvalue.split(':', 1)[1])
#     if inputvalue.split(':')[0] == 'event':
#         currentText = jsonvalue["input"]
#         if("__" in jsonvalue['eval']):
#             print("RES:EXPRINVAL", flush=True)
#             continue
#         result = eval(jsonvalue['eval'], {'__builtins__': {}}, {
#             'inputvalue': None,
#             'jsonvalue': None,
#             'input': currentText,
#             'channelId': jsonvalue['channelId']
#             })
#         print(f"RES:{result}", flush=True)
#     elif inputvalue.split(':')[0] == 'exec':
#         exec(jsonvalue['eval'], {'__builtins__': {}}, {
#             'deleteOriginal': lambda: print('ACT:deleteOriginal'),
#             'react': lambda a: print('ACT:react{{{a}}}'),
#             'send': lambda a: print('ACT:send{{{a}}}'),
#             'sendEmbed': lambda a: print('ACT:sendEmbed{{{a}}}'),
#             'delay': lambda a: time.sleep(a)
#         })
#         print("RES:OK", flush=True)

# '''
# FORMAT:

# event:{"input": "I'm a little teapot", "eval": "'gif' in input", "channelId": "123456789"}
# exec:{"eval": "delay(5); deleteOriginal()"}


# AWAIT:

# RES -> move on, can be: OK, EXPRINVAL, True, False
# ACT -> do an action, can be: deleteOriginal, react{emoji}, send{I am angry}, sendEmbed{I am angry}
# '''

message = {}
actions = []

def setMessage(_message):
    global message

    message = _message
    
def executeExpression(expr):
    return eval(expr, {'__builtins__': {}}, {'message': message })

def executeBlock(expr):
    global actions
    actions = []
    exec(expr, {'__builtins__': { '__import__': __import__, 'int': int, 'str': str }, 'message': message, 'print': print, 'deleteOriginal': deleteOriginal, 'react': react, 'createWaitable': createWaitable})
    return actions

waitables = {}

def executeWaitable(id, message):
    global actions
    actions = []
    if(waitables[id] and waitables[id](message)):
        return [True, actions]
    waitables[id] = None
    return [False, actions]

def waitableTimeout(id):
    waitables[id] = None

# Functions
def print(message):
    actions.append('print ' + str(message))

def deleteOriginal():
    actions.append('deleteOriginal')

def react(emoji):
    for e in emoji:
        if not 0 <= ord(e) <= 127:
            actions.append('react ' + e)
def createWaitable(function):
    actions.append('createWaitable ' + str(id(function)))
    waitables[id(function)] = function
