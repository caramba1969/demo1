import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise, { dbConnect } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    ] : []),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    async signIn({ user }) {
      // Bootstrap: promote to admin if email matches ADMIN_EMAIL env var
      if (user.email && process.env.ADMIN_EMAIL) {
        const adminEmails = process.env.ADMIN_EMAIL.split(',').map(e => e.trim().toLowerCase());
        if (adminEmails.includes(user.email.toLowerCase())) {
          try {
            await dbConnect();
            await User.findOneAndUpdate(
              { email: user.email },
              { role: 'admin' },
              { upsert: false }
            );
          } catch (err) {
            console.error('Failed to promote admin:', err);
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Only runs at sign-in — look up role once and cache it in the JWT
        token.id = user.id;
        try {
          await dbConnect();
          const dbUser = await User.findById(user.id).select('role').lean() as { role?: string } | null;
          token.role = (dbUser?.role as 'admin' | 'user') ?? 'user';
        } catch {
          token.role = 'user';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as 'admin' | 'user') ?? 'user';
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
