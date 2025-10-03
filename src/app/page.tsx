"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
  };
  if (!session) {
    return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <button onClick={() => signIn("google")}>Sign in with Google</button>
        not signed in
      </div>
    );
  }
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <button onClick={() => signIn("google")}>Sign in with Google</button>
      sign in as {session?.user?.name}
      <button onClick={() => handleSignOut()}>Sign out</button>
    </div>
  );
}
