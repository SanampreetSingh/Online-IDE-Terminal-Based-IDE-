const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const env = require("./config/env.config");
const connectDB = require("./config/db.config");
const { handleUpgrade } = require("./services/socket.service");

// Import routes
const authRoutes = require("./routes/auth.routes");
const workspaceRoutes = require("./routes/workspace.routes");
const fileRoutes = require("./routes/file.routes");
const errorHandler = require("./middlewares/errorHandler");

// Cron services
require("./services/cleanup.service");

const app = express();
const server = http.createServer(app);

// 1. PROXY CONFIG
app.set("trust proxy", 1);

// 2. MIDDLEWARE
app.use(cors({
  origin: true,
  credentials: true,
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
}));

app.use(express.json());
app.use(cookieParser());

// Database Connection
connectDB();

// 3. REST ROUTES
app.get("/", (req, res) => res.send("Cloud IDE API is running..."));
app.use("/api/auth", authRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/files", fileRoutes);

// Error Handling Middleware
app.use(errorHandler);

// 4. WEBSOCKET HANDLING
server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname.startsWith("/socket.io")) {
    handleUpgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});

// 5. GRACEFUL SHUTDOWN
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Cleaning up...");
  server.close(() => {
    process.exit(0);
  });
});

const PORT = env.port;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});