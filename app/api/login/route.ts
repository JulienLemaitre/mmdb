import { db } from "@/utils/db";
import * as bcrypt from "bcrypt";

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
    return new Response(JSON.stringify(userWithoutPassword), {
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(null);
    // return new Response("Unauthorized", { status: 401 });
  }
}
