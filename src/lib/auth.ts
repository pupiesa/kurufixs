import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import NextAuth from "next-auth";
import { prisma } from "./prisma"; // export a singleton prisma client

const authSetup = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Use JWT sessions so middleware (Edge) can read session without touching DB
  session: { strategy: "jwt" },
  providers: [
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
          console.warn(
            "Blocked sign-in for email:",
            email,
            "hd:",
            (profile as any)?.hd
          );
          return false; // AccessDenied
        }
        // Auto-assign viewer role if user doesn't have one
        try {
          if (user.id) {
            const existingUser = await prisma.user.findUnique({
              where: { id: user.id },
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
                where: { id: user.id },
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
    // signIn: "/login",
  },
});

export const { handlers, auth, signIn, signOut } = authSetup as any;
// Back-compat for NextAuth v4 where NextAuth returns a single handler function
export const handler = (authSetup as any)?.handlers?.GET ?? (authSetup as any);
