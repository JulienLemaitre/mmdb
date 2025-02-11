import NextAuth from "next-auth/next"; // test with "next-auth" if necessary
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api`
  : "http://localhost:3000/api";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
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
        const res = await fetch(`${API_URL}/login`, {
          method: "POST",
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
          headers: { "Content-Type": "application/json" },
        });
        const user = await res.json();
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
      // We can manage blacklist here for example
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
    async jwt({ token, account, user }) {
      console.log(`[jwt cb] token`, JSON.stringify(token));
      console.log(`[jwt cb] account`, JSON.stringify(account));
      console.log(`[jwt cb] user`, JSON.stringify(user));
      if (account && user) {
        console.log(`[jwt cb] -- First-time login --`);
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.image = user.image;
        token.accessToken = user.accessToken;
      }

      return token;
    },
    async session({ session, token }) {
      // session.user = token as any;
      // console.log(`[session cb] session`, JSON.stringify(session));
      // console.log(`[session cb] token`, JSON.stringify(token));
      // return session;
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          name: token.name as string,
          email: token.email as string,
          role: token.role as string,
          image: token.image as string,
          accessToken: token.accessToken as string,
          accessTokenExpires: token.accessTokenExpires as number,
        },
        error: token.error,
      };
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
