import jwt, { JwtPayload } from "jsonwebtoken";

interface SignOption {
  expiresIn?: string | number;
}
const DEFAULT_SIGN_OPTION: SignOption = {
  expiresIn: "1h",
};

export function signJwtAccessToken(
  payload: JwtPayload,
  options: SignOption = DEFAULT_SIGN_OPTION,
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
