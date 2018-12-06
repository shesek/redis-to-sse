const zmq = require('zeromq').socket('pub')
  .bindSync(process.env.ZMQ_URI || 'tcp://127.0.0.1:3000')

const topic = process.env.ZMQ_TOPIC

let i = 0
setInterval(_ => {
  zmq.send([ topic, JSON.stringify({ foo: 'bar', i: ++i }) ])
}, 1000)
