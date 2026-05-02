"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ProtectedNavItem = {
  label: string;
  href: string;
  description?: string;
};

type ProtectedNavigationProps = {
  items: ProtectedNavItem[];
};

function isActivePath(pathname: string, href: string) {
  const rootPaths = ["/admin", "/caregiver", "/doctor", "/station"];

  if (rootPaths.includes(href)) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProtectedNavigation({ items }: ProtectedNavigationProps) {
  const pathname = usePathname();

  if (!items.length) {
    return null;
  }

  return (
    <nav className="hidden min-w-0 flex-1 items-center justify-center gap-5 lg:flex">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "group relative flex min-h-12 items-center px-1 text-center text-sm font-semibold transition",
              active
                ? "text-neutral-950"
                : "text-neutral-700 hover:text-neutral-950",
            ].join(" ")}
          >
            <span className="relative whitespace-nowrap">
              {item.label}

              {active ? (
                <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-neutral-950" />
              ) : null}
            </span>

            {item.description ? (
              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-3 hidden w-72 -translate-x-1/2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left text-xs font-normal leading-5 text-neutral-600 shadow-lg group-hover:block">
                {item.description}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileProtectedNavigation({ items }: ProtectedNavigationProps) {
  const pathname = usePathname();

  if (!items.length) {
    return null;
  }

  return (
    <div className="border-t border-neutral-100 px-4 py-2 lg:hidden">
      <nav className="flex gap-3 overflow-x-auto">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "relative shrink-0 px-1 py-2 text-sm font-semibold transition",
                active
                  ? "text-neutral-950"
                  : "text-neutral-700 hover:text-neutral-950",
              ].join(" ")}
            >
              {item.label}

              {active ? (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-neutral-950" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}