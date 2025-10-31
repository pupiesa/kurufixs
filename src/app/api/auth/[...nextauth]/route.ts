// import { handler, handlers } from "@/lib/auth";

// // Support NextAuth v5 (handlers object) and fallback (single handler)
// export const GET = handlers?.GET ?? handler;
// export const POST = handlers?.POST ?? handler;

// // Ensure this route runs on the Node.js runtime (not Edge),
// // because Prisma Client is not supported on Edge runtimes.
// export const runtime = "nodejs";

// app/api/auth/[...nextauth]/route.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db"; // <-- ปรับ path ให้ตรงโปรเจกต์คุณ

// helper: ensure default "viewer" role exists and return its id
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

const auth = NextAuth({
  adapter: PrismaAdapter(prisma),

  // ใช้ JWT เพื่อให้อ่านได้จาก middleware (Edge) ผ่าน getToken()
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

        // ถ้าไม่มี role ให้ตั้งเป็น viewer
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
      // ถ้าต้องการจำกัดโดเมน: ใช้เช็คใน callbacks.signIn ด้านล่าง
    }),
  ],

  callbacks: {
    /**
     * JWT callback:
     * - ใส่ id ลง token ครั้งแรกที่ sign-in
     * - รีเฟรช role จาก DB เป็นระยะ (ป้องกัน token ค้างหลังเปลี่ยน role ที่ DB)
     * - รองรับ trigger: "update" เพื่ออัปเดต role ผ่าน session.update()
     */
    async jwt({ token, user, trigger, session }) {
      if (user?.id) token.sub = user.id; // canonical id

      if (trigger === "update" && session?.role) {
        (token as any).role = session.role as string;
        (token as any).roleRefreshedAt = Date.now();
        return token;
      }

      const shouldRefresh =
        !(token as any).role ||
        !(token as any).roleRefreshedAt ||
        Date.now() - Number((token as any).roleRefreshedAt) > 10 * 60 * 1000; // 10 นาที

      if (shouldRefresh) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: token.sub ? { id: token.sub } : { email: token.email! },
            select: { role: { select: { name: true } } },
          });
          (token as any).role =
            dbUser?.role?.name ?? (token as any).role ?? "viewer";
          (token as any).roleRefreshedAt = Date.now();
        } catch {
          // ถ้า DB ล้มเหลว ให้คงค่าเดิมไว้
        }
      }

      return token;
    },

    /**
     * Session callback:
     * - map JWT -> session.user (ฝั่ง client ใช้)
     */
    async session({ session, token }) {
      // Ensure session.user exists. Some NextAuth flows may call the session
      // callback with an empty session object; create user container so we
      // can reliably attach id/role values.
      if (!session.user) {
        // create a minimal user object to return to the client
        // This prevents callers from receiving session.user === null
        // which led to confusing null-user cases in the app.
        (session as any).user = {};
      }
      if (token?.sub) (session.user as any).id = token.sub;
      (session.user as any).role = (token as any)?.role ?? "viewer";
      return session;
    },

    /**
     * signIn callback:
     * - จำกัดโดเมน Google (ตัวอย่าง KMITL)
     * - ถ้า user ยังไม่มี role -> ตั้งค่า viewer
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
          console.error("Error assigning viewer role:", err);
          // ไม่บล็อกการ sign-in
        }
      }
      return true;
    },
  },

  events: {
    /**
     * เมื่อ Adapter สร้าง user ใหม่ (เช่น Google OAuth ครั้งแรก)
     * -> ใส่ role viewer ให้
     */
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

  pages: {
    // signIn: "/auth", // ถ้าต้องการใช้เพจ custom
  },
});

// v5 style exports
export const { handlers, auth: authServer, signIn, signOut } = auth;

// Route handlers for Next.js App Router
export const GET = handlers.GET;
export const POST = handlers.POST;
