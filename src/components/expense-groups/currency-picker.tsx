"use client";

import { useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CurrencyOption } from "@/lib/expense-groups/client";

type Props = {
  id?: string;
  value: string;
  onValueChange: (code: string) => void;
  currencies: CurrencyOption[];
  disabled?: boolean;
  placeholder?: string;
};

export function CurrencyPicker({
  id,
  value,
  onValueChange,
  currencies,
  disabled,
  placeholder = "Select a currency",
}: Props) {
  const [open, setOpen] = useState(false);

  const selected = currencies.find((c) => c.code === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        data-placeholder={selected ? undefined : ""}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-1.5 rounded-none border border-input bg-transparent py-2 pe-2 ps-2.5 text-xs whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50",
        )}
      >
        <span className="line-clamp-1 flex items-center gap-1.5">
          {selected ? (
            <>
              {selected.symbol} {selected.code} — {selected.name}
            </>
          ) : (
            value || placeholder
          )}
        </span>
        <CaretDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-(--anchor-width) min-w-(--anchor-width) p-0"
      >
        <Command shouldFilter={true}>
          <CommandInput placeholder="Search currencies…" />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {currencies.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.code} ${c.name} ${c.symbol}`}
                  data-checked={value === c.code}
                  onSelect={() => {
                    onValueChange(c.code);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{c.symbol}</span>
                  <span className="text-muted-foreground">{c.code}</span>
                  <span className="truncate">{c.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
