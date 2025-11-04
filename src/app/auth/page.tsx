// app/auth/page.tsx
import Image from "next/image";
import { Logincard } from "@/components/Logincard";
import { auth } from "@/lib/auth";
import { ShieldCheck } from "lucide-react";

export const runtime = "nodejs";

type SP = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  let session = null;
  try {
    session = (await auth()) ?? null;
  } catch (e) {
    console.error("AUTH_ERROR /auth:", e);
  }

  if (session?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center flex-col p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">You are already signed in</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            If you were redirected here by mistake, click below to go home.
          </p>
          <a href="/" className="text-sm text-blue-600 underline">
            Go to dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center flex-col p-6">
      {/* Logo + version */}
      <div className="relative mb-4">
        <Image
          src="/sta.png"
          alt="Kurufix Logo"
          width={140}
          height={140}
          className="rounded-full shadow"
          priority
        />
        <span className="absolute -right-2 -bottom-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/90 text-white shadow">
          v2
        </span>
      </div>

      <div style={{ width: "100%", maxWidth: 420 }} className="flex flex-col items-center">
        {/* Brand: K สีส้ม */}
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center">
          <span className="text-orange-500">K</span>urufix
        </h1>
        <p className="text-sm text-muted-foreground mb-5 text-center">
          Asset repair request system — please sign in to continue
        </p>

        <Logincard />

        {error === "AccessDenied" && (
          <div
            className="mb-4 mt-3 rounded-lg"
            style={{ background: "#fff3f3", color: "#b00020", padding: 12 }}
          >
            Only specific organization accounts are @kmitl.ac.th allowed.
          </div>
        )}

        {/* Trust row */}
        <div className="mt-4 ml-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Secured by NextAuth</span>
        </div>
      </div>
    </main>
  );
}
