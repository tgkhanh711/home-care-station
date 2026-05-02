"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  description: string;
};

type ProtectedRoleNavProps = {
  navItems: NavItem[];
  homeHref: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizePath(path: string) {
  if (!path) return "/";
  if (path === "/") return "/";
  return path.replace(/\/+$/, "");
}

export function ProtectedRoleNav({
  navItems,
  homeHref,
}: ProtectedRoleNavProps) {
  const pathname = normalizePath(usePathname() ?? "/");
  const normalizedHomeHref = normalizePath(homeHref);

  function isActive(href: string) {
    const target = normalizePath(href);

    if (pathname === target) {
      return true;
    }

    if (target === normalizedHomeHref) {
      return false;
    }

    return pathname.startsWith(`${target}/`);
  }

  return (
    <>
      <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto px-4 md:flex">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative shrink-0 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                active
                  ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                  : "border-transparent text-neutral-800 hover:border-neutral-200 hover:bg-neutral-100 hover:text-neutral-950",
              )}
            >
              <span className={active ? "text-white" : "text-inherit"}>
                {item.label}
              </span>

              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-max max-w-xs -translate-x-1/2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-normal leading-5 text-neutral-600 shadow-lg group-hover:block">
                {item.description}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-100 px-4 py-2 md:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-800",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}