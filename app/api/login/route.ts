import { db } from "@/utils/server/db";
import * as bcrypt from "bcrypt";
import { signJwtAccessToken } from "@/utils/server/jwt";
import { prodLog } from "@/utils/debugLogger";

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
    !user ||
    !user.passwordHash ||
    !(await bcrypt.compare(body.password, user.passwordHash))
  ) {
    return new Response(
      JSON.stringify({
        error: "Wrong login / password combination",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!user.emailVerified) {
    return new Response(
      JSON.stringify({
        error: "Email/account not verified",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (
    user &&
    user.passwordHash &&
    user.emailVerified &&
    (await bcrypt.compare(body.password, user.passwordHash))
  ) {
    const { passwordHash: _hash, ...userWithoutPassword } = user;
    const accessToken = signJwtAccessToken(userWithoutPassword);
    const result = {
      ...userWithoutPassword,
      accessToken,
    };
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }

  prodLog.warn("Error while login - this case should not happen");
}
