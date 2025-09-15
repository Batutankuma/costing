"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { RiSettingsLine, RiTeamLine, RiLogoutBoxLine } from "@remixicon/react";
import { authClient } from "@/lib/auth-client";

type UserDropdownProps = {
  name?: string;
  email?: string;
  avatarUrl?: string;
};

export default function UserDropdown({
  name = "Keith Kennedy",
  email = "k.kennedy@originui.com",
  avatarUrl = "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp1/user_sam4wh.png",
}: UserDropdownProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const { data: session } = authClient.useSession();

  const displayName = session?.user?.name ?? name;
  const displayEmail = session?.user?.email ?? email;
  const displayAvatar = session?.user?.image ?? avatarUrl;

  const initials = (displayName || displayEmail || "").trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s: string) => s.charAt(0).toUpperCase())
    .join("") || "U";

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await authClient.signOut();
      router.push("/login");
    } catch (error) {
      // noop – optionally add toast
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          <Avatar className="size-8">
            {displayAvatar ? (
              <AvatarImage src={displayAvatar} width={32} height={32} alt="Profile image" />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64" align="end">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {displayName}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {displayEmail}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <RiSettingsLine
              size={16}
              className="opacity-60"
              aria-hidden="true"
            />
            <span>Account settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <RiTeamLine size={16} className="opacity-60" aria-hidden="true" />
            <span>Affiliate area</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={signingOut} className="cursor-pointer">
          <RiLogoutBoxLine
            size={16}
            className="opacity-60"
            aria-hidden="true"
          />
          <span>{signingOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
