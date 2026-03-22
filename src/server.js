import dotenv from "dotenv";
import express from "express";
import { connectMongo } from "./startup/mongo.js";
import { transactionMiddleware } from "./middleware/transactionMiddleware.js";
import { responseWrapperMiddleware } from "./middleware/responseWrapperMiddleware.js";
import { optionalAuthMiddleware } from "./middleware/authMiddleware.js";
import { registerRoutes } from "./startup/routes.js";
import { closePdfBrowser } from "./modules/pdf/pdf.services.js";

dotenv.config();

function gracefulExit() {
  closePdfBrowser()
    .catch(() => {})
    .finally(() => process.exit(0));
}
process.once("SIGINT", gracefulExit);
process.once("SIGTERM", gracefulExit);

async function bootstrap() {
  const app = express();

  app.use(express.json({ limit: "8mb" }));

  // Basic CORS setup to allow frontend on port 3000
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });

  // Attach Mongo client and db to app.locals
  await connectMongo(app);

  // Each request runs inside a MongoDB transaction
  app.use(transactionMiddleware);

  // Standardize response shape with dual responseCode fields
  app.use(responseWrapperMiddleware);

  // JWT auth middleware – verifies token if present, attaches req.user (optional, doesn't block)
  app.use(optionalAuthMiddleware);

  // Register all domain routes
  registerRoutes(app);

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", err);
  process.exit(1);
});

