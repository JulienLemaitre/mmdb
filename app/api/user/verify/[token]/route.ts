import { db } from "@/utils/db";
import { NextRequest } from "next/server";
import { verifyJwt } from "@/utils/jwt";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest, props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const decodedToken = verifyJwt(params.token) as {
    user: { id: string };
  } | null;
  if (!decodedToken || !decodedToken?.user?.id) {
    // TODO redirect to error page
    console.log(`[user/verify ERROR] decodedToken :`, decodedToken);
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 400,
    });
  }

  const user = await db.user.update({
    where: { id: decodedToken.user.id },
    data: { emailVerified: new Date() },
  });

  console.log(`[user/verify GET] updated user :`, user);

  if (user) {
    const { passwordHash, ...userWithoutPassword } = user;
    redirect("/login?message=Email verified");
  } else {
    return new Response(null);
  }
}
