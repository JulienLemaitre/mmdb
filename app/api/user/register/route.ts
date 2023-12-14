import { db } from "@/utils/db";
import * as bcrypt from "bcrypt";
import { signJwtAccessToken } from "@/utils/jwt";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterBody;

  const user = await db.user.findFirst({
    where: { email: body.email },
  });

  if (user) {
    return new Response(
      JSON.stringify({ error: "User already exists with this email" }),
      {
        status: 400,
      },
    );
  }

  if (!(body.name && body.email && body.password)) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
    });
  }

  const newUser = {
    name: body.name,
    email: body.email,
    passwordHash: await bcrypt.hash(body.password, 10),
  };

  // Persist the user in db
  const createdUser = await db.user.create({ data: newUser });

  if (!createdUser) {
    return new Response(
      JSON.stringify({ error: "An error occurred - User not created" }),
      {
        status: 400,
      },
    );
  }

  // Send confirmation email to verify the email address
  const token = signJwtAccessToken(
    { user: { id: createdUser.id } },
    {
      expiresIn: "1h",
    },
  );
  const verifyLink = `http://localhost:3000/api/user/verify/${token}`;
  console.log(`[register] verifyLink :`, verifyLink);
  // TODO: send an email with the link to verify the email address

  return new Response(JSON.stringify(createdUser), {
    headers: { "Content-Type": "application/json" },
  });
}
