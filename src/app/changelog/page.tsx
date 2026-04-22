'use client';

import React from "react";
import { Sidebar } from "@/components/Sidebar";

const changelogEntries = [
  {
    version: "v1.7",
    date: "2026-04-20",
    highlights: [
      "✨ Feature: Forgot password — users can request a password reset link from the sign-in page",
      "✨ Feature: Reset password page — secure token-based form to set a new password via emailed link",
      "� Fix: Resolved double scrollbar issue by strictly enforcing TopNav height to mathematically align with sidebar and main content areas (`h-12` instead of dynamic padding)",
      "�🔒 Security: Fixed OtpType collision — ephemeral credential tokens now use type 'credential-token', freeing 'reset-password' for its correct purpose",
      "🔒 Security: Reset tokens use 32-byte crypto-random hex, expire in 1 hour, and are single-use",
      "🔒 Security: Forgot-password endpoint never reveals whether an email is registered (anti-enumeration)",
    ]
  },
  {
    version: "v1.6",
    date: "2026-04-12",
    highlights: [
      "♻️ Refactor: Extracted FactoryImport into shared model at src/lib/models/FactoryImport.ts — eliminates inline schema duplication in imports/exports routes",
      "🔒 Security: User deletion now cascade-deletes all user data — factories, production lines, locations, imports/exports and OTP records are all removed atomically",
      "✨ Admin: User stats column — factory 🏭, production line ⚙️ and location 📍 counts shown per user in the management table",
      "✨ Admin: Delete confirmation now shows exact data impact (e.g. 'Will permanently delete: 3 factories, 12 production lines, 1 location') before executing",
      "✨ Admin: Delete success toast shows full breakdown of what was removed",
      "⚡ Performance: User stats loaded in parallel per user via Promise.all; opt-in via ?stats=true query param to avoid overhead for large lists",
    ]
  },
  {
    version: "v1.5",
    date: "2026-04-12",
    highlights: [
      "✨ Admin: User deletion — admins can now delete user accounts from the User Management panel",
      "🔒 Security: Admins cannot delete their own account; server-side guard enforced on DELETE endpoint",
      "✨ Admin: Inline delete confirmation — click Delete then confirm before the action is executed",
      "✨ Admin: User count badge in header; toast notifications auto-dismiss after 4 seconds",
      "✨ Admin: Current admin account highlighted with '(you)' label and deletion disabled for self",
    ]
  },
  {
    version: "v1.4",
    date: "2026-04-12",
    highlights: [
      "✨ Landing page: Added dedicated 'Create free account' button — users can now reach sign-up directly without going through sign-in",
      "🐛 Fix: Landing page CTA text updated from 'Google or GitHub only' to reflect email+password option",
      "🐛 Fix: Added Suspense boundary around useSearchParams() in sign-in and verify-OTP pages (required by Next.js 15)",
    ]
  },
  {
    version: "v1.3",
    date: "2026-04-12",
    highlights: [
      "🐛 Fix: Resend error responses were silently swallowed — both sendOtpEmail and sendVerifyEmail now throw on Resend errors so failures surface properly",
    ]
  },
  {
    version: "v1.2",
    date: "2026-05-31",
    highlights: [
      "📧 Email + Password authentication — Users can now register and sign in with email and password (no Google required)",
      "🔐 OTP MFA — Every email+password sign-in requires a one-time 6-digit code sent to the user's email",
      "✉️ Email verification — Registration sends a verification link; unverified accounts cannot sign in",
      "🛡️ Anti-enumeration protection — sign-in always runs bcrypt compare to prevent timing-based email discovery",
      "⚡ Short-lived credential tokens — OTP verification issues a 2-minute token; raw passwords never reach NextAuth",
      "🔑 CredentialsProvider — Added alongside Google OAuth; both strategies supported simultaneously",
      "🔁 Auto-advance OTP input — 6-box digit input with paste support on the verify screen",
      "🗑️ MongoDB TTL cleanup — OTP documents auto-expire (5 min login OTP, 2 min credential token, 24 h verify-email)",
      "🔧 CI: Added RESEND_API_KEY and RESEND_FROM_EMAIL dummy env vars so CI builds pass without real keys"
    ]
  },
  {
    version: "v1.1",
    date: "2026-04-12",
    highlights: [
      "🔐 Role-based Access Control — Admin and User roles with full enforcement",
      "🛡️ Security-trimmed navigation — Admin menu link only visible to admins; all nav hidden for unauthenticated users",
      "👥 User Management UI — Admins can view all users and change roles from the Admin page",
      "🔒 API protection — All /api/admin/* endpoints return 403 for non-admins",
      "⚙️ Server-side admin guard — /admin page redirects non-admins at the layout level",
      "🚀 Bootstrap admin — Set ADMIN_EMAIL in .env.local to auto-promote on first sign-in",
      "⚡ Performance fix — Role is cached in JWT, no extra DB call on every request",
      "✨ Landing page — Unauthenticated visitors see a feature intro page with sign-in CTA instead of the app",
      "🔒 Route protection — All app UI routes (/graph, /flow, /locations, /recipes, /admin, /migrate) redirect unauthenticated users to sign-in via middleware",
      "🛠️ Developer agent — Added @developer custom agent that implements plans from @architect-review / @infra-engineer and always updates the changelog",
      "🐛 Fix: Change Log page now publicly visible to all users (unauthenticated and authenticated)",
      "🔒 Security: Change Log restricted to admins only — hidden from nav, protected by middleware and server layout guard"
    ]
  },
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
    <>
      <Sidebar
        factories={[]}
        onAddFactory={() => {}}
        onSelectFactory={() => {}}
        onDeleteFactory={() => {}}
        onReorderFactories={() => {}}
      />
      <main className="ml-64 flex-1 overflow-y-auto h-[calc(100vh-3rem)] bg-neutral-950">
        <div className="max-w-2xl mx-auto py-8 px-4">
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
      </div>
      </main>
    </>
  );
}
