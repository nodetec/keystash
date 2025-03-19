import { LockIcon, UnlockIcon } from "lucide-react";
import { Link, Outlet } from "react-router";

import { Button } from "./components/ui/button";

export function Layout() {
  return (
    <main className="flex h-screen flex-col justify-between pb-[18px]">
      <header className="draggable flex h-12 items-center gap-2 justify-end px-[18px] text-white">
        <Button
          // className="text-accent-foreground rounded-full"
          variant="outline"
          size="sm"
        >
          New Key
        </Button>
        <Button variant="outline" size="icon">
          <UnlockIcon />
        </Button>
      </header>
      <div className="px-[18px]">
        <Outlet />
      </div>
      <footer className="border-accent border-t pt-[18px]">
        <nav className="flex w-full items-center justify-center gap-4">
          <Link to="/">
            <Button variant="secondary">Keys</Button>
          </Link>
          <Link to="/profile">
            <Button disabled variant="secondary">
              Profile
            </Button>
          </Link>
          <Link to="/relays">
            <Button disabled variant="secondary">
              Relays
            </Button>
          </Link>
          <Link to="/about">
            <Button disabled variant="secondary">
              About
            </Button>
          </Link>
        </nav>
      </footer>
    </main>
  );
}
