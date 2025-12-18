import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const DEFAULT_SIGN_OPTION: SignOptions = {
  expiresIn: "30d",
};

export function signJwtAccessToken(
  payload: JwtPayload,
  options: SignOptions = DEFAULT_SIGN_OPTION,
) {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;
  return jwt.sign(payload, jwtSecretKey!, options);
}

export function verifyJwt(token: string) {
  try {
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const decoded = jwt.verify(token, jwtSecretKey!);
    return decoded as JwtPayload;
  } catch (error) {
    console.log(error);
    return null;
  }
}
