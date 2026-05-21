"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const THEMES = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

export function ThemeCard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const current = mounted ? theme ?? "system" : "system";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Choose how Splitty looks. System follows your device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="inline-flex w-fit items-center gap-1">
          {THEMES.map(({ value, label, icon: Icon }) => {
            const active = current === value;
            return (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={active ? "secondary" : "ghost"}
                aria-pressed={active}
                onClick={() => setTheme(value)}
                className={cn(
                  active
                    ? "border-input"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon /> {label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
