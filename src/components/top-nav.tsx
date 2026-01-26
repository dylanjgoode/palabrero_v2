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
    <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full border px-4 py-2 transition ${
              isActive
                ? "border-[rgb(var(--accent))] bg-white/80 text-[rgb(var(--accent))]"
                : "border-black/10 text-[rgb(var(--ink))] hover:border-black/40"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
