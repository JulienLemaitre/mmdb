import { db } from "@/utils/db";
import * as bcrypt from "bcrypt";
import { signJwtAccessToken } from "@/utils/jwt";

interface RequestBody {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;

  const user = await db.user.findFirst({
    where: { email: body.email },
  });

  if (
    user &&
    user.passwordHash &&
    (await bcrypt.compare(body.password, user.passwordHash))
  ) {
    const { passwordHash, ...userWithoutPassword } = user;
    const accessToken = signJwtAccessToken(userWithoutPassword);
    const result = {
      ...userWithoutPassword,
      accessToken,
    };
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(null);
  }
}
