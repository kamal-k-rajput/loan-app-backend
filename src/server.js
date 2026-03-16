import dotenv from "dotenv";
import express from "express";
import { connectMongo } from "./startup/mongo.js";
import { transactionMiddleware } from "./middleware/transactionMiddleware.js";
import { responseWrapperMiddleware } from "./middleware/responseWrapperMiddleware.js";
import { optionalAuthMiddleware } from "./middleware/authMiddleware.js";
import { registerRoutes } from "./startup/routes.js";

dotenv.config();

async function bootstrap() {
  const app = express();

  app.use(express.json());

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

