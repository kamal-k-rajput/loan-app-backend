export function transactionMiddleware(req, res, next) {
  const client = req.app.locals.mongoClient;
  if (!client) {
    return next(new Error("MongoDB client not initialized"));
  }

  const session = client.startSession();
  req.mongoSession = session;

  // End the session only after the response has been sent
  res.on("finish", async () => {
    try {
      await session.endSession();
    } catch {
      // ignore errors on cleanup
    }
  });

  next();
}
