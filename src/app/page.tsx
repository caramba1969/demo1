"use client";
import { useState } from "react";
import Image from "next/image";
import { Sidebar } from "../components/Sidebar";
import { FactorySection } from "../components/FactorySection";

export default function Home() {
  const [factories, setFactories] = useState<{ id: string }[]>([]);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar onAddFactory={() => setFactories(f => [...f, { id: crypto.randomUUID() }])} />
      <main className="flex-1 flex flex-col items-center p-8">
        {factories.length === 0 ? (
          <div className="text-neutral-400 mt-16">No factories yet. Click "Add Factory" to get started.</div>
        ) : (
          factories.map(f => <FactorySection key={f.id} />)
        )}
      </main>
    </div>
  );
}
