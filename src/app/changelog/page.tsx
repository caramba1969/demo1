import React from "react";

const changelogEntries = [
  {
    version: "v1.0",
    date: "2025-06-22",
    highlights: [
      "🚀 Major Feature: Factory Exports Display - Shows which factories are importing from each factory",
      "📊 Enhanced Supply Chain Visibility - Complete view of import/export relationships",
      "🔄 Real-time Export Tracking - Automatic updates when production lines change",
      "📋 Grouped Export Display - Organized by destination factory with item breakdown",
      "⚡ Improved Refresh System - Immediate updates for all dependency calculations",
      "🎯 Better User Experience - Clear visual organization of factory relationships"
    ]
  },
  {
    version: "v0.9",
    date: "2025-06-21",
    highlights: [
      "🔐 Complete Authentication System - Google OAuth with NextAuth integration",
      "👤 User-specific Data Isolation - All factories and production lines are private to each user",
      "🔗 Advanced Dependency Tracking - Intelligent analysis of missing ingredients with import suggestions",
      "📦 Import/Export Management - Create and manage supply chains between factories",
      "🚫 Duplicate Import Prevention - Smart validation to prevent conflicting imports",
      "🔄 Dynamic Capacity Tracking - Real-time updates when production capacity changes",
      "🎨 Enhanced UI Components - Modern interface with dismissible notifications",
      "📖 Recipes Database Page - Searchable, filterable recipe browser with images",
      "🛠️ Migration Tools - Administrative tools for legacy data migration",
      "🔒 Comprehensive API Protection - All endpoints secured with authentication"
    ]
  },
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
