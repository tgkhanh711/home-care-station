"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  description: string;
};

type AppTopNavigationProps = {
  navItems: NavItem[];
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppTopNavigation({ navItems }: AppTopNavigationProps) {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden items-center justify-center gap-1 lg:flex">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <div key={item.href} className="relative">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "group flex min-h-12 items-center rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                  "focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2",
                  active
                    ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                    : "border-transparent bg-transparent text-neutral-800 hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-950",
                ].join(" ")}
              >
                <span className="whitespace-nowrap">{item.label}</span>

                <span
                  className={[
                    "pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left text-xs leading-5 text-neutral-700 shadow-xl",
                    "opacity-0 translate-y-1 transition duration-150",
                    "group-hover:opacity-100 group-hover:translate-y-0",
                    "group-focus-visible:opacity-100 group-focus-visible:translate-y-0",
                  ].join(" ")}
                >
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">
                    {item.label}
                  </span>
                  {item.description}
                </span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="flex gap-2 overflow-x-auto py-2 lg:hidden">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                active
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-800",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}