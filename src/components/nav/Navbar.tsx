"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Menu, Search, X } from "lucide-react";
import { Logo } from "./Logo";
import { SearchDialog } from "./SearchDialog";
import { NotificationsMenu } from "./NotificationsMenu";
import { Avatar } from "@/components/ui/Avatar";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const NAV = [
  { href: "/beliefs", label: "Beliefs" },
  { href: "/markets", label: "Markets" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { unread } = useStore();
  const { user, isAnonymous, signOut } = useAuth();
  const [search, setSearch] = useState(false);
  const [notif, setNotif] = useState(false);
  const [menu, setMenu] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Blend into the hero at the top of the home page; solidify on scroll.
  const transparent = pathname === "/" && !scrolled && !menu;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const showAuthedNav = !!user && !isAnonymous;

  const handleSignOut = async () => {
    setProfileMenu(false);
    setMenu(false);
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 transition-colors duration-300",
          transparent
            ? "border-b border-transparent bg-transparent"
            : "border-b border-border bg-background/80 backdrop-blur-xl"
        )}
      >
        <div className="container-content relative flex h-16 items-center justify-between gap-4">
          <Logo variant="text" />

          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-border bg-white/[0.03] p-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-white/[0.06] text-white"
                    : "text-content-secondary hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSearch(true)}
              className="btn-ghost h-9 w-9 rounded-full p-0"
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <div className="relative">
              <button
                onClick={() => setNotif((v) => !v)}
                className="btn-ghost relative h-9 w-9 rounded-full p-0"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unread}
                  </span>
                )}
              </button>
              <NotificationsMenu open={notif} onClose={() => setNotif(false)} />
            </div>

            {showAuthedNav ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setProfileMenu((v) => !v)}
                  className="ml-1 flex items-center rounded-full transition-transform hover:scale-105"
                  aria-label="Profile menu"
                >
                  <Avatar src={user.avatar} alt={user.name} size={32} />
                </button>
                <AnimatePresence>
                  {profileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-border bg-card p-1.5 shadow-2xl"
                      >
                        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                          <Avatar src={user.avatar} alt={user.name} size={36} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{user.name}</p>
                            <p className="truncate text-xs text-content-secondary">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                        <div className="my-1 h-px bg-border" />
                        {[
                          { href: "/profile", label: "Profile" },
                          { href: "/settings", label: "Settings" },
                          { href: "/leaderboard", label: "Leaderboard" },
                        ].map((i) => (
                          <Link
                            key={i.href}
                            href={i.href}
                            onClick={() => setProfileMenu(false)}
                            className="block rounded-xl px-3 py-2 text-sm text-content-secondary transition-colors hover:bg-white/[0.05] hover:text-white"
                          >
                            {i.label}
                          </Link>
                        ))}
                        <div className="my-1 h-px bg-border" />
                        <button
                          onClick={handleSignOut}
                          className="block w-full rounded-xl px-3 py-2 text-left text-sm text-content-secondary transition-colors hover:bg-white/[0.05] hover:text-white"
                        >
                          Sign out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="hidden h-9 items-center rounded-full border border-border bg-white/[0.05] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.1] md:inline-flex"
              >
                Sign in
              </Link>
            )}

            <button
              onClick={() => setMenu((v) => !v)}
              className="btn-ghost h-9 w-9 rounded-full p-0 md:hidden"
              aria-label="Menu"
            >
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menu && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border md:hidden"
            >
              <div className="container-content flex flex-col gap-1 py-3">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenu(false)}
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-sm font-medium",
                      isActive(item.href)
                        ? "bg-white/[0.05] text-white"
                        : "text-content-secondary"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                {showAuthedNav ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setMenu(false)}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-content-secondary"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMenu(false)}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-content-secondary"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="rounded-xl px-4 py-2.5 text-left text-sm font-medium text-content-secondary"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/sign-in"
                    onClick={() => setMenu(false)}
                    className="btn-primary mx-4 mt-1 h-10"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <SearchDialog open={search} onClose={() => setSearch(false)} />
    </>
  );
}
