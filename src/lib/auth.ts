import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import NextAuth from "next-auth";
import { prisma } from "./prisma"; // export a singleton prisma client

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" }, // or "jwt" if you prefer
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // optionally limit hostedDomain: "your.edu"
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // expose role to client
      if (session.user) {
        (session.user as any).role = user.role?.name ?? null;
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // first-time login: attach default role
      if (!user.roleId) {
        const viewer = await prisma.role.findUnique({
          where: { name: "viewer" },
        });
        if (viewer)
          await prisma.user.update({
            where: { id: user.id },
            data: { roleId: viewer.id },
          });
      }
      return true;
    },
  },
  pages: {
    // If you want custom pages
    // signIn: "/login",
  },
});
