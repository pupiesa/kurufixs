import { Logincard } from "@/components/Logincard";
import { auth } from "@/lib/auth";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const error =
    typeof searchParams?.error === "string" ? searchParams?.error : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center flex-col">
      <Image
        src="/sta.png"
        alt="logo"
        width={100}
        height={100}
        className="rounded-full"
      />
      <div
        style={{ width: "100%", maxWidth: 420 }}
        className="flex flex-col items-center"
      >
        <h1 className="text-7xl font-bold my-5 text-center">Kuru fix V.2</h1>
        <Logincard />

        {error === "AccessDenied" && (
          <div
            style={{
              background: "#fff3f3",
              color: "#b00020",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            Only @kmitl.ac.th accounts are allowed.
          </div>
        )}
      </div>
    </main>
  );
}
