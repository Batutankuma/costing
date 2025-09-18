"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Theme = "system" | "light" | "dark";
type Language = "fr" | "en";

const THEME_KEY = "app_theme";
const LANG_KEY = "app_lang";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const role = (session?.user as any)?.role as "ADMIN" | "COMMERCIAL" | undefined;
  const [theme, setTheme] = useState<Theme>("system");
  const [language, setLanguage] = useState<Language>("fr");
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [currPw, setCurrPw] = useState("");
  const [newPw, setNewPw] = useState("");

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.replace("/dashboard/sales-quotes/create");
      return;
    }
    const t = (localStorage.getItem(THEME_KEY) as Theme) || "system";
    const l = (localStorage.getItem(LANG_KEY) as Language) || "fr";
    setTheme(t);
    setLanguage(l);
    applyTheme(t);
  }, [role, router]);

  useEffect(() => {
    const onChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [theme]);

  const langLabel = useMemo(() => (language === "fr" ? "Français" : "English"), [language]);

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(THEME_KEY, theme);
      localStorage.setItem(LANG_KEY, language);
      applyTheme(theme);
    } finally {
      setTimeout(() => setSaving(false), 350);
    }
  };

  const handlePasswordChange = async () => {
    setPwSaving(true);
    try {
      const resp = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: currPw, newPassword: newPw }),
      });
      if (!resp.ok) {
        const msg = await resp.text();
        console.error("password change failed:", msg);
      } else {
        setCurrPw("");
        setNewPw("");
      }
    } finally {
      setTimeout(() => setPwSaving(false), 350);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Personnalisez votre thème et votre langue.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thème</CardTitle>
            <CardDescription>Choisissez l'apparence de l'interface.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Apparence</Label>
              <Select value={theme} onValueChange={(v: Theme) => setTheme(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un thème" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Système</SelectItem>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Sombre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Langue</CardTitle>
            <CardDescription>Sélectionnez la langue de l'application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Langue</Label>
              <Select value={language} onValueChange={(v: Language) => setLanguage(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir la langue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {(!role || role === "ADMIN") && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Modules</CardTitle>
              <CardDescription>Accédez rapidement aux modules de l'application.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/dashboard/users"><Button className="w-full" variant="secondary">Utilisateurs</Button></Link>
                <Link href="/dashboard/clients"><Button className="w-full" variant="secondary">Clients</Button></Link>
                <Link href="/dashboard/prospects"><Button className="w-full" variant="secondary">Prospects</Button></Link>
                <Link href="/dashboard/prices"><Button className="w-full" variant="secondary">Str. de prix Minier</Button></Link>
                <Link href="/dashboard/non-mining-prices"><Button className="w-full" variant="secondary">Str. de prix Non-Minier</Button></Link>
                <Link href="/dashboard/builders"><Button className="w-full" variant="secondary">Builder Minier</Button></Link>
                <Link href="/dashboard/non-mining-builders"><Button className="w-full" variant="secondary">Builder Non-Minier</Button></Link>
                <Link href="/dashboard/transport-rates"><Button className="w-full" variant="secondary">Tarifs Transport</Button></Link>
                <Link href="/dashboard/build-const-kalemie"><Button className="w-full" variant="secondary">Build Kalemie</Button></Link>
              </div>
            </CardContent>
          </Card>
        )}

        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Mot de passe</CardTitle>
            <CardDescription>Changez votre mot de passe.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mot de passe actuel</Label>
              <input className="h-9 w-full rounded-md border border-border bg-background px-3" type="password" value={currPw} onChange={(e) => setCurrPw(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <input className="h-9 w-full rounded-md border border-border bg-background px-3" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={handlePasswordChange} disabled={pwSaving || !currPw || !newPw}>
                {pwSaving ? "Changement..." : "Changer le mot de passe"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}


