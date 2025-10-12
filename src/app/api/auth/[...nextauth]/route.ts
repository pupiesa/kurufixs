import { handler, handlers } from "@/lib/auth";

// Support NextAuth v5 (handlers object) and fallback (single handler)
export const GET = handlers?.GET ?? handler;
export const POST = handlers?.POST ?? handler;

// Ensure this route runs on the Node.js runtime (not Edge),
// because Prisma Client is not supported on Edge runtimes.
export const runtime = "nodejs";
