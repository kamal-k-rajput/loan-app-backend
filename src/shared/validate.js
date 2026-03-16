export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.fail(400, "VALIDATION_ERROR", error.details.map((d) => d.message));
    }

    req.body = value;
    next();
  };
}

