import { db } from "@/utils/server/db";
import * as bcrypt from "bcrypt";
import { signJwtAccessToken } from "@/utils/server/jwt";

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
    console.log(
      `[] No user or no passwordHash in user or wrong password provided :`,
      user,
    );
    return new Response(
      JSON.stringify({
        error: "No user or no passwordHash in user or wrong password provided",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
