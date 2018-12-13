// Setup redis
const redis = require('redis').createClient(process.env.REDIS_URI)
var channels = process.env.SUB_CHANNELS.split(',');
console.log(process.env.SUB_CHANNELS)
for (var i = 0; i < channels.length; i++) {
  console.log('subscribe: ' + channels[i])
  redis.subscribe(channels[i])
}

// Log messages and number of SSE subscribers
redis.on('message', (chan, msg) => console.log(`Broadcasting ${chan}: ${msg}`))
setInterval(_ => console.log(`Total subscribers: ${ redis.listenerCount('message') - 1 }`), 60000)

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

  function onMsg (chan, msg) {
    res.write(`event:${chan}\ndata:`)
    res.write(msg) // pass msg buffer through without serializing to string
    res.write('\n\n')
  }
  redis.on('message', onMsg)

  const keepAlive = setInterval(_ => res.write(': keepalive\n\n'), 25000)

  req.once('close', _ => (redis.removeListener('message', onMsg)
                        , clearInterval(keepAlive)
                        , console.log('Subscriber disconnected')))
})

app.listen(
  process.env.PORT || 4500
, process.env.ADDRESS || '127.0.0.1'
, function() { console.log(`HTTP server running on ${this.address().address}:${this.address().port}`) }
)
