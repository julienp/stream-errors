Example to test piping streams and handling errors.

It shows the importance of destroying a response stream if an
error occurs. Without doing so the client will assume the stream ended
normally and only receive partial data.

Additionally we must handle the `aborted` signal on the response stream.

Note that node-fetch doesn't handle the `aborted` signal.

## Without pipeline on the server, and no explicit stream.destroy

We can get either get the complete file (221701 bytes at the time of testing), 0 bytes or a partial file. In any case the client assumes we received the full response.

```
% npm run clienthttp no
> stream-errors@1.0.0 clienthttp /Users/julien/Projects/stream-errors
> node src/clienthttp.js "no"

{ status: 200, length: 221701, end: 'dy></html>' }
res close

% npm run clienthttp no
> stream-errors@1.0.0 clienthttp /Users/julien/Projects/stream-errors
> node src/clienthttp.js "no"

{ status: 200, length: 0, end: '' }
res close

% npm run clienthttp no
> stream-errors@1.0.0 clienthttp /Users/julien/Projects/stream-errors
> node src/clienthttp.js "no"

{ status: 200, length: 171998, end: '(1);}.css-' }
res close
```

## Using pipeline on the server

We receive either the complete file, `ECONNRESET` or the `aborted` signal.

```
Projects/stream-errors master% npm run clienthttp yes

> stream-errors@1.0.0 clienthttp /Users/julien/Projects/stream-errors
> node src/clienthttp.js "yes"

{ status: 200, length: 221701, end: 'dy></html>' }
res close
Projects/stream-errors master% npm run clienthttp yes

> stream-errors@1.0.0 clienthttp /Users/julien/Projects/stream-errors
> node src/clienthttp.js "yes"

Error in request: socket hang up { error:
   { Error: socket hang up
       at createHangUpError (_http_client.js:332:15)
       at Socket.socketOnEnd (_http_client.js:435:23)
       at Socket.emit (events.js:203:15)
       at endReadableNT (_stream_readable.js:1145:12)
       at process._tickCallback (internal/process/next_tick.js:63:19) code: 'ECONNRESET' } }
Projects/stream-errors master% npm run clienthttp yes

> stream-errors@1.0.0 clienthttp /Users/julien/Projects/stream-errors
> node src/clienthttp.js "yes"

res aborted
{ status: 200, length: 87774, end: 'rect x="56' }
res close
```
