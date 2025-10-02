import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import NextAuth from "next-auth";
import { prisma } from "./prisma"; // export a singleton prisma client

const authSetup = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // optionally limit hostedDomain: "your.edu"
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (!session.user) return session;

      const userId = (user as any)?.id ?? session.user.id;
      if (userId) {
        session.user.id = userId;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: { select: { name: true } } },
          });
          (session.user as any).role = dbUser?.role?.name ?? null;
        } catch {
          (session.user as any).role = null;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = (
          (profile as any)?.email ??
          user.email ??
          ""
        ).toLowerCase();
        const domain = email.split("@")[1] ?? "";
        const allowed =
          domain === "kmitl.ac.th" ||
          domain.endsWith(".kmitl.ac.th") ||
          (profile as any)?.hd === "kmitl.ac.th";
        if (!email || !allowed) {
          console.warn(
            "Blocked sign-in for email:",
            email,
            "hd:",
            (profile as any)?.hd
          );
          return false; // AccessDenied
        }
      }
      // ...existing role assignment...
      return true;
    },
  },
  pages: {
    // signIn: "/login",
  },
});

export const { handlers, auth, signIn, signOut } = authSetup as any;
// Back-compat for NextAuth v4 where NextAuth returns a single handler function
export const handler = (authSetup as any)?.handlers?.GET ?? (authSetup as any);
