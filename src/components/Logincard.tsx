"use client";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
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
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

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

export function Logincard() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [caps, setCaps] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => setCaps(e.getModifierState?.("CapsLock") || false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const identifier = String(fd.get("identifier") || "").trim();
    const password = String(fd.get("password") || "");

    const res = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
      callbackUrl: "/",
    });

    setLoading(false);
    if (!res || (res as any).error) {
      setErr("Invalid credentials");
    } else {
      window.location.href = (res as any).url || "/";
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>username & Login with Google</CardDescription>
          </div>
          <CardAction>
            <Link href="/auth/register">
              <Button variant="link" className="px-0">Sign up</Button>
            </Link>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="w-full">
        <form onSubmit={onSubmit} noValidate>
          <div className="flex flex-col gap-6 px-10">
            {/* Identifier */}
            <div className="grid gap-2">
              <Label htmlFor="identifier">Email or Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder="you@gmail.com or username"
                  className="pl-7"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="/"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </span>
                <Input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  className="pl-9 pr-10"
                  required
                  autoComplete="current-password"
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
              {caps && <p className="text-[11px] text-amber-600">Caps Lock is on</p>}
            </div>

            {err && (
              <p className="text-sm text-red-600" role="alert" aria-live="polite">
                {err}
              </p>
            )}
          </div>

          <CardFooter className="flex-col gap-2 px-8 pt-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            {/* Google login */}
            <Button
              variant="outline"
              className="w-full mt-1 gap-2"
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              aria-label="Login with Google"
            >
              <GoogleIcon className="h-4 w-4" />
              <span>Login with Google</span>
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
