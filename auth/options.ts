import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api`
  : "http://localhost:3000/api";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "your@email.here",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // You need to provide your own logic here that takes the credentials
        // submitted and returns either an object representing a user or value
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
          return user as any;
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
      } as any;
    },
  },
  pages: {
    signIn: "/login",
    // signOut: "/logout",
    error: "/auth/error",
    // verifyRequest: "/login",
    // newUser: "/login",
  },
};
