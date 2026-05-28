"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import login_img from "@/public/assets/login_img.jpg";
import logo from "@/public/assets/logo.png";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/dashboard");
    }
  }, [isPending, session, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || "Connexion impossible");
        return;
      }
      setSuccess("Connexion réussie. Redirection...");
      setTimeout(() => router.push("/dashboard"), 700);
    } catch (err: any) {
      console.error(err);
      // Extraire le message d'erreur de better-auth
      const errorMessage = 
        err?.message || 
        err?.error?.message || 
        err?.data?.message ||
        "Connexion impossible. Vérifiez vos identifiants.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isPending && session) {
    return null;
  }

  return (
    <div className="min-h-[100svh] grid grid-cols-1 lg:grid-cols-2">
      {/* Left: logo + form */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center justify-center">
            <Image src={logo} alt="Logo" width={200} height={200} />
          </div>
        
          {success && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-600">
              {success}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="me@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</Button>
          </form>
        </div>
      </div>
      {/* Right: hero image */}
      <div className="hidden lg:block relative min-h-[100svh]">
        <Image src={login_img} alt="Login visual" fill priority className="object-cover" />
      </div>
    </div>
  );
}


