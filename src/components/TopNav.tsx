"use client";
import { FC } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Menu, LogIn, LayoutDashboard, BarChart2, BookOpen, HeartHandshake, User, Settings } from "lucide-react";

export const TopNav: FC = () => {
  const pathname = usePathname();
  
  return (
    <nav className="w-full flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 shadow-sm z-50">
      <div className="flex items-center gap-3">
        <Menu className="w-6 h-6 text-neutral-400" aria-label="Open sidebar" />
        <span className="font-bold text-lg tracking-tight text-neutral-100">
          Satisfactory Factories <span className="text-xs text-neutral-400">(ALPHA v0.4)</span>
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
        </Link>
        <Button variant="ghost" className="flex gap-1 text-neutral-200" aria-label="Graph (WIP)">
          <BarChart2 className="w-5 h-5" /> Graph (WIP)
        </Button>
        <Button variant="ghost" className="flex gap-1 text-neutral-200" aria-label="Recipes">
          <BookOpen className="w-5 h-5" /> Recipes
        </Button>
        <Button variant="ghost" className="flex gap-1 text-neutral-200" aria-label="Change Log">
          <BookOpen className="w-5 h-5" /> Change Log
        </Button>
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
      </div>
      <div className="flex gap-2 items-center">
        <Button variant="outline" className="border-pink-500 text-pink-400 hover:bg-pink-500/10" aria-label="Support me on Ko-fi">
          <HeartHandshake className="w-5 h-5" /> Ko-fi
        </Button>
        <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/10" aria-label="Discord">
          {/* Use a fallback icon for Discord, e.g., User */}
          <User className="w-5 h-5" /> Discord
        </Button>
        <Button variant="default" className="bg-neutral-700 text-neutral-100" aria-label="Sign In">
          <LogIn className="w-5 h-5" /> Sign In
        </Button>
      </div>
    </nav>
  );
};
