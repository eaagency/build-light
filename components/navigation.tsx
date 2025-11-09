"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";

export function Navigation() {
  const { isSignedIn } = useAuth();

  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href={isSignedIn ? "/dashboard" : "/"} className="flex items-center gap-3">
              {/* BuildLight Logo - Geometric B/L monogram */}
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">BL</span>
              </div>
              <span className="text-2xl font-bold text-primary">BuildLight</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-foreground hover:text-accent transition-colors"
                >
                  Dashboard
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                    },
                  }}
                />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-foreground hover:text-accent transition-colors px-4 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-accent hover:bg-accent/90 text-primary font-medium px-6 py-2 rounded-lg transition-colors"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
