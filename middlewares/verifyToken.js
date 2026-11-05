import { createRemoteJWKSet, jwtVerify } from "jose";

const authUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.LOCAL_URL ||
  "http://localhost:3000";

const JWKS = createRemoteJWKSet(new URL(`${authUrl}/api/auth/jwks`));

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send({
      message: "Unauthorized",
    });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);

    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).send({
      message: "Invalid or expired token",
    });
  }
};

export default verifyToken;
