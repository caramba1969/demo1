import React from "react";

const changelogEntries = [
  {
    version: "v0.4",
    date: "2025-06-21",
    highlights: [
      "Removed Ko-fi and Discord buttons from navigation",
      "Removed ALPHA v0.4 label from top bar",
      "Improved database connection setup with .env.local",
      "Bugfix: Error handling for failed factory data loads",
      "UI/UX: Minor style and accessibility improvements"
    ]
  },
  {
    version: "v0.3",
    date: "2025-06-10",
    highlights: [
      "Added support for Cosmos DB connection",
      "Initial implementation of production line cards",
      "Sidebar navigation improvements"
    ]
  }
  // Add more entries as needed
];

export default function ChangelogPage() {
  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Change Log</h1>
      <div className="space-y-8">
        {changelogEntries.map((entry) => (
          <section key={entry.version} className="border-b pb-6">
            <div className="flex items-center gap-4 mb-2">
              <span className="font-semibold text-lg">{entry.version}</span>
              <span className="text-xs text-neutral-400">{entry.date}</span>
            </div>
            <ul className="list-disc list-inside text-sm text-neutral-200">
              {entry.highlights.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
