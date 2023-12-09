import { db } from "@/utils/db";
import * as bcrypt from "bcrypt";

interface RequestBody {
  name: string;
  email: string;
  password: string;
}
export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const user = await db.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await bcrypt.hash(body.password, 10),
    },
  });
  const { passwordHash, ...userWithoutPassword } = user;
  return new Response(JSON.stringify(userWithoutPassword), {
    headers: { "Content-Type": "application/json" },
  });
}
