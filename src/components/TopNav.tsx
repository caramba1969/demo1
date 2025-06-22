"use client";
import { FC } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Menu, LogIn, LayoutDashboard, BarChart2, BookOpen, HeartHandshake, User, Settings } from "lucide-react";

export const TopNav: FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  return (
    <nav className="w-full flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 shadow-sm z-50">
      <div className="flex items-center gap-3">
        <Menu className="w-6 h-6 text-neutral-400" aria-label="Open sidebar" />
        <span className="font-bold text-lg tracking-tight text-neutral-100">
          Satisfactory Factories
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <Link href="/">
          <Button 
            variant="ghost" 
            className={`flex gap-1 ${
              pathname === '/' 
                ? 'text-orange-400 bg-orange-500/10' 
                : 'text-neutral-200 hover:text-orange-300 hover:bg-orange-500/10'
            }`} 
            aria-label="Planner"
          >
            <LayoutDashboard className="w-5 h-5" /> Planner
          </Button>
        </Link>        <Link href="/graph">
          <Button 
            variant="ghost" 
            className={`flex gap-1 ${
              pathname === '/graph' 
                ? 'text-orange-400 bg-orange-500/10' 
                : 'text-neutral-200 hover:text-orange-300 hover:bg-orange-500/10'
            }`} 
            aria-label="Graph"
          >
            <BarChart2 className="w-5 h-5" /> Graph
          </Button>
        </Link>
        <Link href="/recipes">
          <Button variant="ghost" className="flex gap-1 text-neutral-200" aria-label="Recipes">
            <BookOpen className="w-5 h-5" /> Recipes
          </Button>
        </Link>
        <Link href="/changelog">
          <Button variant="ghost" className="flex gap-1 text-neutral-200" aria-label="Change Log">
            <BookOpen className="w-5 h-5" /> Change Log
          </Button>
        </Link>
        <Link href="/admin">
          <Button 
            variant="ghost" 
            className={`flex gap-1 ${
              pathname === '/admin' 
                ? 'text-orange-400 bg-orange-500/10' 
                : 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
            }`} 
            aria-label="Admin"
          >
            <Settings className="w-5 h-5" /> Admin
          </Button>
        </Link>
      </div>      <div className="flex gap-4 items-center">
        {session ? (
          <div className="flex items-center gap-4">
            {/* User Profile Section */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 hover:bg-neutral-800/70 transition-all duration-200">
              {session.user?.image && (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || "User"} 
                  className="w-9 h-9 rounded-full border-2 border-orange-500/70 shadow-sm"
                />
              )}
              <div className="hidden md:block min-w-0">
                <p className="text-sm font-semibold text-neutral-100 truncate max-w-[150px]">
                  {session.user?.name || "User"}
                </p>
                <p className="text-xs text-neutral-400 truncate max-w-[150px]">
                  {session.user?.email}
                </p>
              </div>
            </div>
              {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-300 hover:text-white hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all duration-200 font-medium px-4 py-2"
              aria-label="Sign Out"
              onClick={() => signOut()}
            >
              <LogIn className="w-4 h-4 mr-2 rotate-180" /> 
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        ) : (
          <Link href="/auth/signin">
            <Button
              variant="default"
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
              aria-label="Sign In"
            >
              <LogIn className="w-4 h-4 mr-2" /> Sign In
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};
