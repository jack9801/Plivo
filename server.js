const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

console.log(`Starting server in ${dev ? 'development' : 'production'} mode`);
console.log(`Hostname: ${hostname}, Port: ${port}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;
      
      // Handle routes
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  // Handle WebSocket connections
  io.on('connection', (socket) => {
    console.log('Client connected');

    // Handle service status updates
    socket.on('service:update', (data) => {
      // Broadcast the update to all connected clients
      io.emit('service:updated', data);
    });

    // Handle new incidents
    socket.on('incident:create', (data) => {
      io.emit('incident:created', data);
    });

    // Handle incident updates
    socket.on('incident:update', (data) => {
      io.emit('incident:updated', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    const address = `http://${hostname === '0.0.0.0' ? 'localhost' : hostname}:${port}`;
    console.log(`> Ready on ${address}`);
  });
}); 