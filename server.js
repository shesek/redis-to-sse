// Setup zmq subscriber
const zmq = require('zeromq').socket('sub')
  .connect(process.env.ZMQ_URI || 'tcp://127.0.0.1:3000')
  .subscribe(process.env.ZMQ_TOPIC)

// Log messages and number of SSE subscribers
zmq.on('message', (topic, msg) => console.log(`Broadcasting ${topic}: ${msg}`))
setInterval(_ => console.log(`Total subscribers: ${ zmq.listenerCount('message') - 1 }`), 60000)

// Setup express server
const app = require('express')()
app.set('trust proxy', process.env.PROXIED || 'loopback')
app.use(require('morgan')('dev'))

// SSE endpoint
app.get('/stream', (req, res) => {
  console.log('New subscriber')

  res.set({
    'X-Accel-Buffering': 'no'
  , 'Cache-Control': 'no-cache'
  , 'Content-Type': 'text/event-stream'
  , 'Connection': 'keep-alive'
  }).flushHeaders()

  function onMsg (topic, msg) {
    res.write(`event:${topic}\ndata:`)
    res.write(msg) // pass msg buffer through without serializing to string
    res.write('\n\n')
  }
  zmq.on('message', onMsg)

  const keepAlive = setInterval(_ => res.write(': keepalive\n\n'), 25000)

  req.once('close', _ => (zmq.removeListener('message', onMsg)
                        , clearInterval(keepAlive))
                        , console.log('Subscriber disconnected'))
})

app.listen(
  process.env.PORT || 4500
, process.env.ADDRESS || '127.0.0.1'
, function() { console.log(`HTTP server running on ${this.address().address}:${this.address().port}`) }
)
