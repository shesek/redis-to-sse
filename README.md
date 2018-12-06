# ZMQ to SSE

Subscribes to a zeromq publisher and broadcasts messages
over HTTP server-sent events.

To start the server:

```bash
$ git clone git@github.com:shesek/zmq-to-sse && cd zmq-to-sse
$ npm install
$ ZMQ_URI=tcp://127.0.0.1:3000 ZMQ_TOPIC=foobar PORT=4500 npm start
```

To subscribe to events, send a GET request to `/stream`.
