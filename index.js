const AppChannel            = require('node-mermaid/store/app-channel')()
    , AppTransportChannel   = require('node-mermaid/store/app-transport-channel')()
    , Queue                 = require('node-mermaid/store/queue')
    , AppMemoryFileJSON     = require('node-mermaid/store/app-memory-file-json')
    , parser                = require('node-mermaid/parser')
    , axios                 = require('axios')
    , sleep                 = require('sleep-promise')
    , fse                   = require('fs-extra')
    , fs                    = require('fs')
    , path                  = require('path')
    , condition             = require('./condition')
    , websocket             = require('./webscoket.js')

const queue = new Queue()

const rules = [
  {
    "name": "Fuck Machine",
    "id": 5781.040443098535,
    "platform": "All platforms",
    "conditions": [
      {
        "operator": ">", // see condition.js
        "number": 0,
        "id": 3885.785333101328
      },
      /*
      {
        "operator": "<", // see condition.js
        "number": 0,
        "id": 3885.785333101328
      }
      {
        "operator": "==", // see condition.js
        "number": 0,
        "id": 3885.785333101328
      }
      */
    ],
    "commands":[
      {
        "clientId": "715", // Айди устройства к которому применяются это правило
        "id": 1211.9654263488533
      },
      /*
      {
        delay: 1000,
        id: 231.965422343
      },
      {
        "clientId": "715",
        "id": 1211.9654263488533
      }
      */
    ]
  }
]

// const rules = new AppMemoryFileJSON('rules', [], 10000)

queue.executer(async (data, next, repeat) => {
  const { commands, username, message, tokenCount } = data
  let isError = false

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i]

    if (command.delay) {
      await sleep(parseInt(command.delay))
    }

    if (command.clientId) {
      try {
        const clients = websocket()

        const client = clients.find(client => client.id === command.clientId)

        if (client) {
          const isSend = await client.send(tokenCount, username, message)

          if (!isSend) {
            isError = true
          }
        }
      } catch (e) {
        isError = true
      }
    }
  }

  if (!isError) {
    next()
  } else {
    repeat()
  }
})

const webscoketTipRequest = async data => {
  if (data.isEasyData && data.easyData.events.isTokens) {
    const tokenCount = data.easyData.tokenCount
        , message = data.easyData.message
        , username = data.easyData.username

    const _rules = rules ///.readInterval()

    for (let i = 0; i < _rules.length; i++) {
      const rule = _rules[i]

      const isPlatform = (rule.platform === data.extension.platform || rule.platform === 'All platforms')

      const isTrue = rule.conditions
                      .map(
                        ({ operator, number }) =>
                          condition(tokenCount, operator, parseInt(number))
                      )
                      .find(isTrue => !isTrue) !== false

      if (isTrue && isPlatform) {
        queue.add({
          commands: rule.commands,
          tokenCount,
          message,
          username
        })
      }
    }
  }
}

queue.status(count => {
  AppTransportChannel.writeData({
    type: 'queue',
    data: count
  })
})

AppChannel.on('connect', () => {
  AppTransportChannel.on('connect', () => {
    AppChannel.on('data', data => {
      parser.Chaturbate(data, webscoketTipRequest)
      parser.xHamsterLive(data, webscoketTipRequest)
      parser.Stripchat(data, webscoketTipRequest)
      parser.BongaCams(data, webscoketTipRequest)
    })

    AppChannel.on('reload', () => {
      AppTransportChannel.writeData({
        type: 'reload'
      })
    })
  })
})
