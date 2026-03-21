export function responseWrapperMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.success = (data = null, message = "SUCCESS") => {
    const payload = {
      server: {
        responseCode: 200, // server is running
      },
      data: {
        responseCode: 200,
        message,
        result: data,
      },
    };

    return originalJson(payload);
  };

  res.fail = (code, message = "FAILED", details = null) => {
    const payload = {
      server: {
        responseCode: 200,
      },
      data: {
        responseCode: code,
        message,
        error: details,
      },
    };

    res.status(code);
    return originalJson(payload);
  };

  next();
}
