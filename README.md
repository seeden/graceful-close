# Graceful Close

Close node 6+ server gracefully with timeout support.

```js
import http from 'http';
import enableGracefulClose from 'graceful-close';

const server = http.createServer((req, res) => {
  res.end();
});

const closeGracefully = enableGracefulClose(server, {
  timeout: 3000, // maximum time for closing keep-alive connections [default = 10000]
  sigterm: true, // it will automatically call closeGracefully on process.on('SIGTERM') [default = true]
}, (next) => {
  // close your db connections and everything else here
  // server and all connections are closed in this moment
  // you need to call next after that
  next();
});


//you can call function closeGracefully instead of SIGTERM (set sigterm = false)
```

## Credits

[Zlatko Fedor](http://github.com/seeden)
