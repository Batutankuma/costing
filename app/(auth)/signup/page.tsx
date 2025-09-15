"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authClient.signUp.email({ email, password, name });
      setSuccess("Compte créé. Redirection...");
      setTimeout(() => router.push("/dashboard"), 700);
    } catch (err: any) {
      setError(err?.message || "Création de compte impossible");
    } finally {
      setLoading(false);
    }
  };

  if (!isPending && session) {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Créer un compte</h1>
        <p className="text-sm text-muted-foreground">Commencez avec votre email.</p>
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
          <Label htmlFor="name">Nom</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? "Création..." : "Créer"}</Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Déjà un compte ? <Link className="underline" href="/login">Se connecter</Link>
      </p>
    </div>
  );
}
