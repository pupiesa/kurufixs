// app/auth/register/page.tsx
import Image from "next/image";
import { redirect } from "next/navigation";
import { Registercard } from "@/components/Registercard";
import { auth } from "@/lib/auth";
import { ShieldCheck } from "lucide-react";

type SP = Record<string, string | string[] | undefined>;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (session?.user) redirect("/");

  const error = typeof params?.error === "string" ? params.error : undefined;

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
          <span className="text-orange-500">K</span>urufix account
        </h1>
        <p className="text-sm text-muted-foreground mb-5 text-center">
          Sign up with email/username & password or continue with Google
        </p>

        <Registercard />

        {error === "AccessDenied" && (
          <div
            style={{
              background: "#fff3f3",
              color: "#b00020",
              padding: 12,
              borderRadius: 8,
              marginTop: 12,
            }}
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
