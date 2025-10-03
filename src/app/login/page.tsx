import { Logincard } from "@/components/Logincard";
import { auth, signIn } from "@/lib/auth";
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
    <main
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100dvh",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          Sign in
        </h1>
        <Logincard />
        <p style={{ color: "#666", marginBottom: 20 }}>
          Use your KMITL Google account to continue.
        </p>

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

        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button
            type="submit"
            style={{
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              border: "1px solid #e5e7eb",
              background: "white",
              color: "#111827",
              padding: "12px 16px",
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
