const express = require('express')
const http = require('http')
const WebSocket = require('ws')

const app = express()

const server = http.createServer(app)
const wss = new WebSocket.Server({server})

const checkAlive = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) {
      return ws.terminate()
    }

    ws.isAlive = false
    ws.ping()
  })
}, 60000)

const proxyMessage = (target, message) => {
  if (target.readyState === WebSocket.OPEN) {
    return target.send(message)
  }
  
  target.on('open', () => {
    target.send(message)
  })
}

wss.on('connection', ws => {
  const target = new WebSocket('wss://host.lennar.icu:3233/')
  
  target.on('close', () => {
    ws.terminate()
  })
  
  target.on('message', message => {
    ws.send(message)
  })
  
  ws.isAlive = true
  ws.on('pong', () => {
    ws.isAlive = true
  })
  
  ws.on('close', () => {
    target.terminate()
  })
  
  ws.on('message', message => {
    proxyMessage(target, message)
  })
})

wss.on('close', () => {
  clearInterval(checkAlive)
})

server.listen(process.env.PORT)
