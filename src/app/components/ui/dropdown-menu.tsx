"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";

import { cn } from "./utils";

type DropdownItem =
  | {
      type: "item";
      label: string;
      icon?: React.ReactNode;
      shortcut?: string;
      disabled?: boolean;
      onSelect?: () => void;
    }
  | { type: "checkbox"; label: string; checked: boolean; onCheckedChange?: (checked: boolean) => void }
  | { type: "radio"; label: string; value: string; checked?: boolean; onSelect?: (value: string) => void }
  | { type: "separator" }
  | { type: "submenu"; label: string; icon?: React.ReactNode; children: DropdownItem[] };

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  className?: string;
}

const ITEM_CLASSES =
  "relative flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--text-1)] outline-none transition-colors duration-100 data-[highlighted]:bg-[var(--bg-hover)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

function renderItems(items: DropdownItem[]): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < items.length) {
    const item = items[i];

    if (item.type === "separator") {
      result.push(
        <DropdownMenuPrimitive.Separator key={i} className="-mx-1 my-1 h-px bg-[var(--divider)]" />,
      );
      i++;
      continue;
    }

    if (item.type === "radio") {
      const radios: Extract<DropdownItem, { type: "radio" }>[] = [];
      while (i < items.length && items[i].type === "radio") {
        radios.push(items[i] as Extract<DropdownItem, { type: "radio" }>);
        i++;
      }
      const groupValue = radios.find((r) => r.checked)?.value ?? "";
      result.push(
        <DropdownMenuPrimitive.RadioGroup
          key={`radio-${i}`}
          value={groupValue}
          onValueChange={(v) => radios.find((r) => r.value === v)?.onSelect?.(v)}
        >
          {radios.map((r) => (
            <DropdownMenuPrimitive.RadioItem key={r.value} value={r.value} className={cn(ITEM_CLASSES, "pl-8")}>
              <span className="absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                  <span className="size-2 rounded-full bg-[var(--brand-600)] animate-scale-in" />
                </DropdownMenuPrimitive.ItemIndicator>
              </span>
              {r.label}
            </DropdownMenuPrimitive.RadioItem>
          ))}
        </DropdownMenuPrimitive.RadioGroup>,
      );
      continue;
    }

    if (item.type === "item") {
      result.push(
        <DropdownMenuPrimitive.Item
          key={i}
          disabled={item.disabled}
          onSelect={item.onSelect}
          className={ITEM_CLASSES}
        >
          {item.icon}
          {item.label}
          {item.shortcut && (
            <span className="ml-auto text-xs tracking-widest text-[var(--text-3)]">{item.shortcut}</span>
          )}
        </DropdownMenuPrimitive.Item>,
      );
      i++;
      continue;
    }

    if (item.type === "checkbox") {
      result.push(
        <DropdownMenuPrimitive.CheckboxItem
          key={i}
          checked={item.checked}
          onCheckedChange={item.onCheckedChange}
          className={cn(ITEM_CLASSES, "pl-8")}
        >
          <span className="absolute left-2 flex size-3.5 items-center justify-center">
            <DropdownMenuPrimitive.ItemIndicator>
              <Check className="size-4 text-[var(--brand-600)] animate-scale-in" />
            </DropdownMenuPrimitive.ItemIndicator>
          </span>
          {item.label}
        </DropdownMenuPrimitive.CheckboxItem>,
      );
      i++;
      continue;
    }

    if (item.type === "submenu") {
      result.push(
        <DropdownMenuPrimitive.Sub key={i}>
          <DropdownMenuPrimitive.SubTrigger className={ITEM_CLASSES}>
            {item.icon}
            {item.label}
            <ChevronRight className="ml-auto size-4" />
          </DropdownMenuPrimitive.SubTrigger>
          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.SubContent
              className="glass-strong z-[var(--z-dropdown)] min-w-[12rem] rounded-xl border border-[var(--glass-border)] p-1 text-[var(--text-1)] shadow-[var(--elevation-brand-3)] data-[state=open]:animate-morph-enter data-[state=closed]:animate-morph-exit"
            >
              {renderItems(item.children)}
            </DropdownMenuPrimitive.SubContent>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Sub>,
      );
      i++;
      continue;
    }

    i++;
  }

  return result;
}

export function DropdownMenu({
  trigger,
  items,
  align = "end",
  className,
}: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={6}
          className={cn(
            "glass-strong z-[var(--z-dropdown)] min-w-[12rem] overflow-hidden rounded-xl border border-[var(--glass-border)] p-1 text-[var(--text-1)] shadow-[var(--elevation-brand-3)]",
            "data-[state=open]:animate-morph-enter data-[state=closed]:animate-morph-exit",
            className,
          )}
        >
          {renderItems(items)}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

export type { DropdownItem, DropdownMenuProps };
