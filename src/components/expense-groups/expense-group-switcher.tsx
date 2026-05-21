"use client";

import { useState } from "react";
import {
  CaretUpDownIcon,
  PlusIcon,
  WalletIcon,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useExpenseGroups } from "./expense-group-context";
import { ExpenseGroupCreateDialog } from "./expense-group-create-dialog";

export function ExpenseGroupSwitcher() {
  const { groups, activeGroup, activeGroupId, loading, setActiveGroupId } =
    useExpenseGroups();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createSeed, setCreateSeed] = useState("");

  function handleSelect(id: string) {
    setActiveGroupId(id);
    setOpen(false);
    setQuery("");
  }

  function openCreate() {
    setCreateSeed(query.trim());
    setOpen(false);
    setQuery("");
    setCreateOpen(true);
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              aria-label="Select expense group"
              className="min-w-44 justify-between"
            />
          }
        >
          <span className="flex items-center gap-1.5 truncate">
            <WalletIcon className="size-3.5 opacity-60" />
            <span className="truncate">
              {loading && !activeGroup
                ? "Loading…"
                : activeGroup
                  ? activeGroup.name
                  : "Select expense group"}
            </span>
          </span>
          <CaretUpDownIcon className="size-3.5 opacity-60" />
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} className="w-72 p-0">
          <Command shouldFilter={true}>
            <CommandInput
              placeholder="Search expense groups…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {!loading && groups.length === 0 ? (
                <CommandEmpty>No expense groups yet.</CommandEmpty>
              ) : (
                <CommandEmpty>No matches.</CommandEmpty>
              )}
              {groups.length > 0 && (
                <CommandGroup heading="Your groups">
                  {groups.map((group) => {
                    const isActive = group.id === activeGroupId;
                    return (
                      <CommandItem
                        key={group.id}
                        value={group.name}
                        onSelect={() => handleSelect(group.id)}
                        className="justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <WalletIcon className="opacity-60" />
                          <span
                            className={cn(
                              "truncate",
                              isActive && "font-medium text-foreground",
                            )}
                          >
                            {group.name}
                          </span>
                        </div>
                        <div
                          data-slot="command-shortcut"
                          className="flex shrink-0 items-center gap-1.5"
                        >
                          {group.locked ? (
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Locked
                            </span>
                          ) : null}
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {group.isOwner ? "Owner" : "Member"}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  value="__create_expense_group__"
                  onSelect={openCreate}
                >
                  <PlusIcon />
                  {query.trim()
                    ? `Create “${query.trim()}”…`
                    : "Create expense group…"}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <ExpenseGroupCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialName={createSeed}
      />
    </>
  );
}
