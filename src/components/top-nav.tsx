"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/chat", label: "Chat" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm font-bold">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-5 py-2 transition-colors ${
              isActive
                ? "bg-[rgb(var(--accent-warm))] text-[rgb(var(--accent-hover))]"
                : "text-[rgb(var(--ink-body))] hover:bg-black/5"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}