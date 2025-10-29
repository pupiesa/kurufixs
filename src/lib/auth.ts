import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "./db"; // export a singleton prisma client

const authSetup = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Use JWT sessions so middleware (Edge) can read session without touching DB
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const identifier = (creds as any)?.identifier
          ?.toString()
          .trim()
          .toLowerCase();
        const password = (creds as any)?.password?.toString();
        if (!identifier || !password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }],
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            passwordHash: true,
            roleId: true,
          },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // ensure default viewer role if missing
        if (!user.roleId) {
          const viewer = await prisma.role.findUnique({
            where: { name: "viewer" },
          });
          if (viewer) {
            await prisma.user.update({
              where: { id: user.id },
              data: { roleId: viewer.id },
            });
          }
        }

        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // optionally limit hostedDomain: "your.edu"
    }),
  ],
  callbacks: {
    // Put id/role on the JWT
    async jwt({ token, user, trigger }) {
      // On initial sign-in, attach id and role from DB
      if (user?.id) {
        token.id = user.id;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: { select: { name: true } } },
          });
          (token as any).role = dbUser?.role?.name ?? null;
        } catch {
          (token as any).role = null;
        }
      }
      return token;
    },
    // Read from JWT only (no DB calls here, safe for Edge)
    async session({ session, token }) {
      if (!session.user) return session;
      if (token?.id) session.user.id = token.id as string;
      (session.user as any).role = (token as any)?.role ?? null;
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
          // Redirect to /login with an error message
          return "/auth?error=AccessDenied";
        }
        // Auto-assign viewer role if user doesn't have one
        try {
          // NextAuth may or may not include `user.id` here depending on the
          // provider/version. If it's missing, try to find the user by email.
          let targetUserId: string | null = null;
          if (user.id) targetUserId = user.id;
          else if (user.email) {
            const dbu = await prisma.user.findUnique({
              where: { email: user.email },
              select: { id: true, roleId: true },
            });
            if (dbu) targetUserId = dbu.id;
          }

          if (targetUserId) {
            const existingUser = await prisma.user.findUnique({
              where: { id: targetUserId },
              select: { roleId: true },
            });

            if (!existingUser?.roleId) {
              // Find or create viewer role
              let viewerRole = await prisma.role.findUnique({
                where: { name: "viewer" },
              });

              if (!viewerRole) {
                viewerRole = await prisma.role.create({
                  data: {
                    name: "viewer",
                    description: "Default viewer role with read-only access",
                  },
                });
              }

              // Assign viewer role to user
              await prisma.user.update({
                where: { id: targetUserId },
                data: { roleId: viewerRole.id },
              });
            }
          }
        } catch (error) {
          console.error("Error assigning viewer role:", error);
          // Don't block sign-in if role assignment fails
        }
      }
      return true;
    },
  },
  pages: {
    // signIn: "/auth",
  },
});

export const { handlers, auth, signIn, signOut } = authSetup as any;
// Back-compat for NextAuth v4 where NextAuth returns a single handler function
export const handler = (authSetup as any)?.handlers?.GET ?? (authSetup as any);
