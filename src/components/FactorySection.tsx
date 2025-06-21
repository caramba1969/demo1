"use client";
import { FC, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Pencil, Save } from "lucide-react";

interface FactorySectionProps {
  initialName?: string;
}

export const FactorySection: FC<FactorySectionProps> = ({ initialName = "A new factory" }) => {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);

  return (
    <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mt-8 w-full max-w-3xl mx-auto shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        {editing ? (
          <Input
            className="text-lg font-bold bg-neutral-800 text-neutral-100 border-none focus:ring-2 focus:ring-blue-500 w-auto"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => setEditing(false)}
            autoFocus
            aria-label="Factory name"
          />
        ) : (
          <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            {name}
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit factory name">
              <Pencil className="w-4 h-4" />
            </Button>
          </h2>
        )}
      </div>
      {/* Add more factory details/components here */}
      <div className="text-neutral-400 text-sm">(Factory details go here...)</div>
    </section>
  );
};
