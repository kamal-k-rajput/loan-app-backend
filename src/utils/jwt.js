import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-super-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export function signAuthToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

