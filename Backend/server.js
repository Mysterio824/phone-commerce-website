const express = require("express");
const session = require("express-session");
const passport = require("./interfaces/passport/passport");
const {
  shutdown: redisShutdown,
} = require("./infrastructure/external/redisClient");
const { exec } = require("child_process");
const util = require("util");
const cookieParser = require("cookie-parser");
const checkUser = require("./interfaces/middlewares/JwtMiddleware");
const config = require("./config");
const cors = require("cors");
const path = require("path");
const https = require("https");
const fs = require("fs");
const initializeDatabase = require("./infrastructure/database/initializeDatabase");

const app = express();

app.use(cors(config.app.cors));

app.use("/static", express.static("public"));

app.use(express.json({ limit: config.app.bodyParserLimit || "10mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: config.app.bodyParserLimit || "10mb",
  })
);
app.use(cookieParser());

app.use(
  session({
    secret: config.auth.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.app.environment === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(checkUser);

// Swagger configuration
const YAML = require("yamljs");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = YAML.load("./docs/swagger.yaml");

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const authRoutes = require("./interfaces/routes/authRoute");
const userRoutes = require("./interfaces/routes/userRoute");
const productRoutes = require("./interfaces/routes/productRoute");
const cartRoutes = require("./interfaces/routes/cartRoute");
const categoryRoutes = require("./interfaces/routes/categoryRoute");
const imageRoutes = require("./interfaces/routes/ImageRoute");
const reviewRoutes = require("./interfaces/routes/reviewRoute");
const brandRoutes = require("./interfaces/routes/brandRoute");
const promotionRoutes = require("./interfaces/routes/promotionRoute");
const variantRoutes = require("./interfaces/routes/variantRoute");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/variants", variantRoutes);

app.use((err, req, res, next) => {
  console.error("Error caught by global error handler:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message,
    // stack: config.app.environment === 'development' ? err.stack : undefined
  });
});

const execPromise = util.promisify(exec);

const startServer = async () => {
  try {
    console.log("Initializing database...");
    const dbInitialized = await initializeDatabase();

    if (!dbInitialized) {
      console.error("Failed to initialize database. Exiting...");
      process.exit(1);
    }

    const PORT = config.app.port;

    const server = https.createServer(
      {
        key: fs.readFileSync(path.join(__dirname, "/certs/ca.key")),
        cert: fs.readFileSync(path.join(__dirname, "/certs/ca.crt")),
      },
      app
    );

    server.listen(PORT, async () => {
      console.log(
        `Server running on port ${PORT} in ${config.app.environment} mode`
      );

      if (config.app.environment === "development") {
        const swaggerUrl = `https://localhost:${PORT}/api-docs`;
        console.log(`Opening Swagger UI at ${swaggerUrl}`);

        import("open")
          .then((open) => {
            open.default(swaggerUrl); // Call the default export
          })
          .catch((err) => {
            console.error("Failed to open browser:", err);
          });
      }
    });

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });

    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      shutdown();
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

// Graceful Shutdown Logic
const shutdown = async () => {
  console.log("Shutting down server...");
  try {
    await redisShutdown();
    try {
      const redisCliPath = process.env.REDIS_CLI_PATH;
      if (redisCliPath) {
        await execPromise(
          `"${redisCliPath}" -h ${config.redis.host} -p ${config.redis.port} SHUTDOWN`
        );
        console.log("Redis server stopped successfully");
      }
    } catch (err) {
      console.error("Error stopping Redis server:", err.message);
    }
    server.close(() => {
      console.log("Server shut down successfully");
      process.exit(0);
    });
  } catch (err) {
    console.error("Error during shutdown:", err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
