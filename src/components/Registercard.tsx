"use client";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";
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
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

/** Google "G" icon (inline SVG) */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M12 10.2v3.7h5.2c-.2 1.2-1.5 3.4-5.2 3.4-3.1 0-5.7-2.6-5.7-5.8s2.5-5.8 5.7-5.8c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.8 3.3 14.7 2.5 12 2.5 6.9 2.5 2.8 6.6 2.8 11.7S6.9 20.9 12 20.9c6.4 0 8.9-4.4 8.9-6.8 0-.5-.1-.9-.2-1.2H12z" />
      <path fill="#34A853" d="M3.8 7.4l3 2.2c.8-1.9 2.5-3.3 5.2-3.3 1.8 0 3 .6 3.7 1.2l2.5-2.4C16.8 3.3 14.7 2.5 12 2.5c-3.9 0-7.3 2.2-8.9 5z" />
      <path fill="#FBBC05" d="M12 21c2.7 0 4.9-.9 6.5-2.5l-3-2.5c-.8.6-1.9 1.1-3.5 1.1-2.7 0-4.9-1.8-5.7-4.2l-3 .2c1.6 3.6 5 5.9 8.7 5.9z" />
      <path fill="#4285F4" d="M20.9 14.1c.1-.5.2-1 .2-1.6 0-.6-.1-1.1-.2-1.6H12v3.1h4.9c-.2 1-.8 1.8-1.7 2.3l2.6 2c1.5-1.4 2.4-3.4 2.4-5.2z" />
    </svg>
  );
}

function scorePassword(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, Math.max(0, s - 1)); // 0..4
}

export function Registercard() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const strength = useMemo(() => scorePassword(pw), [pw]);
  const strengthText = ["Weak", "Fair", "Medium", "Good", "Strong"][strength];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "");
    const email = String(fd.get("email") || "");
    const username = String(fd.get("username") || "");
    const password = String(fd.get("password") || "");

    if (password.length < 8) {
      setLoading(false);
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (pw !== pw2) {
      setLoading(false);
      setErr("Password and confirmation do not match.");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: email || null, username: username || null, password }),
    });

    if (!res.ok) {
      setLoading(false);
      setErr((await res.json().catch(() => ({})))?.message || "Registration failed.");
      return;
    }

    // Auto sign-in (prefer username, else email)
    const identifier = username || email;
    const sig: any = await signIn("credentials", {
      redirect: true,
      callbackUrl: "/",
      identifier,
      password,
    });
    setLoading(false);
    if (sig?.error) setErr("Auto sign-in failed, please sign in manually.");
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>
              email/username & Sign up with Google
            </CardDescription>
          </div>
          <CardAction>
            <Link href="/auth">
              <Button variant="link" className="px-0">Sign in</Button>
            </Link>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="w-full">
        <form onSubmit={onSubmit} noValidate>
          <div className="flex flex-col px-10 gap-6">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <User className="h-4 w-4 text-muted-foreground" />
                </span>
                <Input id="name" name="name" type="text" placeholder="Your name" className="pl-9" />
              </div>
            </div>

            {/* Username */}
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" placeholder="username" />
              <p className="text-[11px] text-muted-foreground">Use A–Z, a–z, 0–9. No spaces.</p>
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </span>
                <Input id="email" name="email" type="email" placeholder="@gmail.com,kmitl.ac.th" className="pl-9" />
              </div>
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </span>
                <Input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  className="pl-9 pr-10"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength meter */}
              <div className="mt-1">
                <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${(strength + 1) * 20}%`,
                      background: strength >= 3 ? "rgb(16 185 129)" : strength >= 2 ? "rgb(59 130 246)" : "rgb(239 68 68)",
                    }}
                  />
                </div>
                <p className="text-[11px] mt-1 text-muted-foreground">
                  Password strength: {strengthText} (≥ 8 chars, mix upper/lowercase, numbers, symbols)
                </p>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="grid gap-2">
              <Label htmlFor="password2">Confirm password</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </span>
                <Input
                  id="password2"
                  name="password2"
                  type={showPw2 ? "text" : "password"}
                  className="pl-9 pr-10"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showPw2 ? "Hide password" : "Show password"}
                  onClick={() => setShowPw2((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                >
                  {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}
          </div>

          <CardFooter className="flex-col gap-2 px-8 pt-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>

            {/* Google sign up */}
            <Button
              variant="outline"
              className="w-full mt-1 gap-2"
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              aria-label="Sign up with Google"
            >
              <GoogleIcon className="h-4 w-4" />
              <span>Sign up with Google</span>
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
