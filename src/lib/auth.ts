import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db"; // must export a singleton PrismaClient

// Ensure default "viewer" role exists and return its id
async function ensureViewerRoleId() {
  let viewer = await prisma.role.findUnique({ where: { name: "viewer" } });
  if (!viewer) {
    viewer = await prisma.role.create({
      data: {
        name: "viewer",
        description: "Default viewer role with read-only access",
      },
    });
  }
  return viewer.id;
}

const authKit = NextAuth({
  adapter: PrismaAdapter(prisma),

  // JWT strategy so Edge middleware can read with getToken()
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
          where: { OR: [{ email: identifier }, { username: identifier }] },
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

        // If user has no role, assign "viewer"
        if (!user.roleId) {
          const viewerId = await ensureViewerRoleId();
          await prisma.user.update({
            where: { id: user.id },
            data: { roleId: viewerId },
          });
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
    }),
  ],

  callbacks: {
    /**
     * JWT callback
     * - store id on token.sub (canonical)
     * - refresh role from DB periodically
     */
    async jwt({ token, user, trigger, session }) {
      if (user?.id) token.sub = user.id; // canonical id

      // Allow manual updates via session.update({ role })
      if (trigger === "update" && session?.role) {
        (token as any).role = session.role;
        (token as any).roleRefreshedAt = Date.now();
        return token;
      }

      const shouldRefresh =
        !(token as any).role ||
        !(token as any).roleRefreshedAt ||
        Date.now() - Number((token as any).roleRefreshedAt) > 10 * 60 * 1000; // 10 minutes

      if (shouldRefresh) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: token.sub ? { id: token.sub } : { email: token.email! },
            select: { role: { select: { name: true } } },
          });
          (token as any).role =
            dbUser?.role?.name ?? (token as any).role ?? "viewer";
          (token as any).roleRefreshedAt = Date.now();
        } catch (err) {
          // keep prior token.role if DB fails
          console.error("JWT role refresh failed:", err);
        }
      }

      return token;
    },

    /**
     * Session callback
     * - map token -> session.user
     */
    async session({ session, token }) {
      if (!session.user) session.user = {} as any;
      // Read id from canonical sub; fallback to legacy token.id
      session.user.id = (token.sub ?? (token as any).id ?? "") as string;
      (session.user as any).role = (token as any)?.role ?? "viewer";
      return session;
    },

    /**
     * signIn callback
     * - example domain restriction for Google
     * - ensure default viewer role if missing
     */
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
          return "/auth?error=AccessDenied";
        }

        try {
          let targetUserId: string | null = user.id ?? null;
          if (!targetUserId && user.email) {
            const dbu = await prisma.user.findUnique({
              where: { email: user.email },
              select: { id: true, roleId: true },
            });
            if (dbu) targetUserId = dbu.id;
          }

          if (targetUserId) {
            const existing = await prisma.user.findUnique({
              where: { id: targetUserId },
              select: { roleId: true },
            });

            if (!existing?.roleId) {
              const viewerId = await ensureViewerRoleId();
              await prisma.user.update({
                where: { id: targetUserId },
                data: { roleId: viewerId },
              });
            }
          }
        } catch (err) {
          console.error("Google signIn: role assignment failed", err);
        }
      }
      return true;
    },
  },

  events: {
    // When a new user is created by the adapter, ensure they get "viewer"
    async createUser({ user }) {
      try {
        if (!user?.id) return;
        const viewerId = await ensureViewerRoleId();
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: viewerId },
        });
      } catch (err) {
        console.error("createUser event: failed to assign viewer role", err);
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});

// v5 exports
export const { handlers, auth, signIn, signOut } = authKit;
