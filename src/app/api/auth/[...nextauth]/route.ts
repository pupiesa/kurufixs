import { handlers, handler } from "@/lib/auth";

// Support NextAuth v5 (handlers object) and fallback (single handler)
export const GET = handlers?.GET ?? handler;
export const POST = handlers?.POST ?? handler;
