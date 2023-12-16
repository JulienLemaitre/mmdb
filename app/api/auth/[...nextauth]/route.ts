import NextAuth from "next-auth/next"; // test with "next-auth" if necessary
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.VERCEL_URL
  ? `${process.env.VERCEL_URL}/api`
  : "http://localhost:3000/api";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "your@email.here",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // You need to provide your own logic here that takes the credentials
        // submitted and returns either a object representing a user or value
        // that is false/null if the credentials are invalid.
        // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
        // You can also use the `req` object to obtain additional parameters
        // (i.e., the request IP address)
        console.log(`[Credentials authorize] API_URL :`, API_URL);
        const res = await fetch(`${API_URL}/login`, {
          method: "POST",
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
          headers: { "Content-Type": "application/json" },
        });
        console.log(`[auth authorize] res :`, res);
        console.log(`[auth authorize] res.ok :`, res.ok);
        const user = await res.json();
        console.log(`[auth authorize] user :`, user);
        if (user.error) {
          // Return null if user data could not be retrieved
          console.log(`[auth authorize] user.error :`, user.error);
          return null;
        }

        // If no error and we have user data, return it
        if (res.ok && user) {
          return user;
        }
        // Return null if user data could not be retrieved
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log(
        `[signIn cb] { user, account, profile, email, credentials }`,
        JSON.stringify({ user, account, profile, email, credentials }, null, 2),
      );
      const isAllowedToSignIn = true;
      if (isAllowedToSignIn) {
        return true;
      } else {
        // Return false to display a default error message
        return false;
        // Or you can return a URL to redirect to:
        // return '/unauthorized'
      }
    },
    async session({ session, token }) {
      session.user = token as any;
      return session;
    },
    async jwt({ token, user }) {
      return { ...token, ...user };
    },
  },
  pages: {
    signIn: "/login",
    // signOut: "/logout",
    error: "/auth/error",
    // verifyRequest: "/login",
    // newUser: "/login",
  },
});

export { handler as GET, handler as POST };
