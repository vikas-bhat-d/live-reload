const injectScript = function (port) {
  return (req, res, next) => {
    console.log("middleware function called")
    const script = `
          <script>
            (function() {
              const socket = new WebSocket('ws://localhost:${port}');
              socket.onopen = function(event) {
                console.log('WebSocket connection opened');
              };
              socket.onmessage = function(event) {
                console.log('Message from server:', event.data);
                if (event.data === 'reload') {
                  window.location.reload();
                }
              };
              socket.onclose = function(event) {
                console.log('WebSocket connection closed');
              };
              socket.onerror = function(error) {
                console.error('WebSocket error:', error);
              };
            })();
          </script>
        `;

    let chunks = [];

    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (chunk, ...args) {
      chunks.push(Buffer.from(chunk));
      console.log("modified res.write called")
    }

    res.end = function (chunk, ...args) {
      console.log("modified res.end called")
      if (chunk)
        chunks.push(Buffer.from(chunk));

      const body = Buffer.concat(chunks).toString('utf8')

      if (res.getHeader('Content-Type') && res.getHeader("Content-Type").includes('text/html')) {
        const modifiedBody = body.replace('</body>', `${script}</body>`)

        if (res.getHeader('Content-Length')) {
          res.setHeader('Content-Length', Buffer.byteLength(modifiedBody));
        }

        originalWrite.apply(res,[modifiedBody])

      } else {
        originalWrite.apply(res,[body])
      }
      originalEnd.apply(res, args);
    }
    next();
  }
}


module.exports = injectScript;