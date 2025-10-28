// app/auth/page.tsx
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type SP = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams; // ✅ resolve the promise
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center flex-col">
      <Image
        src="/sta.png"
        alt="logo"
        width={100}
        height={100}
        className="rounded-full"
      />
      {/* …your UI… */}
      {error === "AccessDenied" && (
        <div>Only @kmitl.ac.th accounts are allowed.</div>
      )}
    </main>
  );
}
