import { jwtVerify, SignJWT, type JWTPayload } from "jose";

const ALG = "HS256";
const ISSUER = "splitty";
const AUDIENCE = "splitty-web";

let cachedSecret: Uint8Array | null = null;
function secret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters");
  }
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}

export type SessionClaims = JWTPayload & {
  sub: string;
  email: string;
  name: string;
};

export async function signSessionToken(
  claims: Pick<SessionClaims, "sub" | "email" | "name">,
  expiresIn: string = "7d",
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, secret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: [ALG],
  });
  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string"
  ) {
    throw new Error("Invalid session token payload");
  }
  return payload as SessionClaims;
}
