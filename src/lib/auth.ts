import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise, { dbConnect } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";

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
    CredentialsProvider({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        verifiedToken: { label: "Verified Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.verifiedToken) return null;

        await dbConnect();

        // Validate the short-lived verified token issued after OTP check
        const otp = await Otp.findOne({
          email: credentials.email.toLowerCase(),
          code: credentials.verifiedToken,
          type: "credential-token",
          expiresAt: { $gt: new Date() },
        });

        if (!otp) return null;

        // Single-use — consume immediately
        await Otp.deleteOne({ _id: otp._id });

        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
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

      // Block credentials users who haven't verified their email
      if (account?.provider === 'credentials') {
        await dbConnect();
        const dbUser = await User.findOne({ email: user.email });
        if (!dbUser?.emailVerified) return false;
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
