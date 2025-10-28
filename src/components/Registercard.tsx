"use client";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Registercard() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "");
    const email = String(fd.get("email") || "");
    const username = String(fd.get("username") || "");
    const password = String(fd.get("password") || "");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: email || null,
        username: username || null,
        password,
      }),
    });

    if (!res.ok) {
      setLoading(false);
      setErr(
        (await res.json().catch(() => ({})))?.message || "Registration failed",
      );
      return;
    }

    // Auto sign-in with what user provided (prefer username, else email)
    const identifier = username || email;
    // signIn may return different shapes depending on redirect option; cast to any to avoid strict typing issues
    const sig = (await signIn("credentials", {
      redirect: true,
      callbackUrl: "/",
      identifier,
      password,
    })) as any;
    setLoading(false);
    if (sig?.error) setErr("Auto sign-in failed, please try logging in.");
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create new account</CardTitle>
        <CardDescription>
          Sign up with email/username and password
        </CardDescription>
        <CardAction>
          <Link href="/auth">
            <Button variant="link">Login</Button>
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@kmitl.ac.th"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
          </div>
          <CardFooter className="flex-col gap-2 px-0 pt-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </Button>
            <Button
              variant="outline"
              className="w-full mt-1"
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              Sign up with Google
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
