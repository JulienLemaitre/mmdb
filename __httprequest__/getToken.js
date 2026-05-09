function base64UrlEncode(input) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let binary = "";

  for (let i = 0; i < input.length; i++) {
    binary += input.charCodeAt(i).toString(2).padStart(8, "0");
  }

  let base64 = "";
  for (let i = 0; i < binary.length; i += 6) {
    const chunk = binary.substring(i, i + 6);
    const index = parseInt(chunk.padEnd(6, "0"), 2);
    base64 += chars[index];
  }

  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function getToken(payload) {
  const secret = request.environment.get("jwtSecretKey");

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const expSeconds = 30 * 24 * 60 * 60;

  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.hmac
    .sha256()
    .withTextSecret(secret)
    .updateWithText(unsignedToken)
    .digest()
    .toBase64(true);

  return `${unsignedToken}.${signature}`;
}

export { getToken };
