const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const setupRoutes = require('./routes');
const setupSocketHandlers = require('./socket/handlers');

const app = express();
app.use(cors());
app.use(express.json());

// 挂载模块化 API 路由
setupRoutes(app);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
// 设置 Socket 处理器
setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
