// app/auth/page.tsx
import Image from "next/image";
import { redirect } from "next/navigation";
import { Logincard } from "@/components/Logincard";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

type SP = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  let session: Awaited<ReturnType<typeof auth>> | null = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("AUTH_ERROR /auth:", e);
  }
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center flex-col">
      <Image
        src="/sta.png"
        alt="logo"
        width={100}
        height={100}
        className="rounded-full"
        priority
      />
      <div
        style={{ width: "100%", maxWidth: 420 }}
        className="flex flex-col items-center"
      >
        <h1 className="text-7xl font-bold my-5 text-center">Kuru fix V.2</h1>
        <Logincard />
        {error === "AccessDenied" && (
          <div
            className="mb-4 rounded-lg"
            style={{ background: "#fff3f3", color: "#b00020", padding: 12 }}
          >
            Only @kmitl.ac.th accounts are allowed.
          </div>
        )}
      </div>
    </main>
  );
}
