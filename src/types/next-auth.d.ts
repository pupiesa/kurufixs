import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    roleId?: string | null;
  }
}

export {};
