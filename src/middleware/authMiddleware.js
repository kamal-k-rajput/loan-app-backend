import { verifyAuthToken } from "../utils/jwt.js";

// Optional auth - verifies token if present, attaches req.user, but doesn't block
export function optionalAuthMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    return next(); // No token, continue (for public routes)
  }

  try {
    const decoded = verifyAuthToken(token);
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      dealerId: decoded.dealerId || null,
      lenderId: decoded.lenderId || null
    };
    next();
  } catch (err) {
    return res.fail(401, "UNAUTHORIZED", "Invalid or expired token");
  }
}

// Required auth - must have valid token
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.fail(401, "UNAUTHORIZED", "Please login to continue");
  }
  next();
}

// Legacy name for backward compatibility
export const authMiddleware = optionalAuthMiddleware;

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.fail(401, "UNAUTHORIZED", "Please login to continue");
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.fail(403, "FORBIDDEN", "You are not authorized to access this resource");
    }
    next();
  };
}
