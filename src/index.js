const defaultOptions = {
  timeout: 10 * 1000, // 10 seconds HEROKU DEFAULT
  sigterm: true,
};

export default function enableGracefulClose(server, userOptions, callback) {
  if (typeof userOptions === 'function') {
    return enableGracefulClose(server, {}, userOptions);
  }

  const options = {
    ...defaultOptions,
    ...userOptions,
  };

  const connections = new Set();
  let closing = false;

  server.on('connection', (connection) => {
    connections.add(connection);
    connection.on('close', () => connections.delete(connection));
  });

  function close() {
    if (closing) {
      callback(new Error('Server closing is already in the progress'));
      return;
    }

    closing = true;

    let timeoutId = setTimeout(() => {
      timeoutId = null;

      for (let connection of connections) {
        connection.end();
      }

      connections.clear();
    }, options.timeout);

    // server can be opened and closed again
    server.close(() => {
      closing = false;

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // end process
      if (!callback) {
        process.exit(0);
      }

      // add user ability to close his things
      callback(() => {
        process.exit(0);
      })
    });
  }

  if (options.sigterm) {
    process.on('SIGTERM', close);
  }

  return close;
}
