"use client";

import { useMemo, useState } from "react";
import { CaretDownIcon, UserIcon } from "@phosphor-icons/react";

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
import type { ExpenseGroupMemberSummary } from "@/lib/expense-groups/client";

type Props = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  members: ExpenseGroupMemberSummary[];
  currentUserId?: string | null;
  disabled?: boolean;
  placeholder?: string;
};

export function MemberPicker({
  id,
  value,
  onValueChange,
  members,
  currentUserId,
  disabled,
  placeholder = "Select a member",
}: Props) {
  const [open, setOpen] = useState(false);

  const sortedMembers = useMemo(() => {
    if (!currentUserId) return members;
    const me = members.find((m) => m.userId === currentUserId);
    const others = members.filter((m) => m.userId !== currentUserId);
    return me ? [me, ...others] : members;
  }, [members, currentUserId]);

  const selected = members.find((m) => m.userId === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled || members.length === 0}
        data-placeholder={selected ? undefined : ""}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-1.5 rounded-none border border-input bg-transparent py-2 pe-2 ps-2.5 text-xs whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50",
        )}
      >
        <span className="line-clamp-1 flex items-center gap-1.5">
          {selected ? (
            <>
              {selected.name}
              {currentUserId === selected.userId ? " (you)" : ""}
            </>
          ) : (
            placeholder
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
          <CommandInput placeholder="Search by name…" />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {sortedMembers.map((m) => {
                const isMe = currentUserId === m.userId;
                return (
                  <CommandItem
                    key={m.userId}
                    value={`${m.name} ${m.email}`}
                    data-checked={value === m.userId}
                    onSelect={() => {
                      onValueChange(m.userId);
                      setOpen(false);
                    }}
                  >
                    <UserIcon className="opacity-60" />
                    <div className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-xs text-foreground">
                        {m.name}
                        {isMe ? " (you)" : ""}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {m.email}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
