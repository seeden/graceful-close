import debug from 'debug';

const log = debug('graceful');

export default function enableGracefulClose(server, userOptions, callback) {
  if (typeof userOptions === 'function') {
    return enableGracefulClose(server, {}, userOptions);
  }

  const options = {
    timeout: 10 * 1000, // 10 seconds HEROKU DEFAULT
    ...userOptions,
  };

  const connections = new Set();
  let closing = false;

  server.on('connection', (connection) => {
    connections.add(connection);
    connection.on('close', () => connections.delete(connection));
  });

  function close() {
    log('Graceful close start');
    if (closing) {
      log('Server closing is already in the progress');
      return;
    }

    closing = true;

    // without all closed connections close will not call callback
    if (connections.size) {
      log('We have keep-alive connections. Waiting');
      setTimeout(() => {
        log('Closing all connections');
        for (const connection of connections) {
          connection.end();
        }

        connections.clear();
      }, options.timeout);
    }

    // server can be opened and closed again
    log('Closing listening');
    server.close(async () => {
      log('Server listening is closed');
      closing = false;

      // end process
      if (callback) {
        await callback();
      }

      process.exit(0);
    });
  }

  process.on('SIGINT', close);
  process.on('SIGTERM', close);

  return close;
}
