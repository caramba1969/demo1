# Flow Page — UX Test Report
**Page:** `/flow` — Visual Flow Editor
**Tested:** 2026-04-06
**Tester:** Claude (automated browser audit)

---

## Summary

The Flow Editor canvas has **2 critical crashes/data-loss bugs** that need immediate attention before any other work. The core drag-to-connect mechanic works at the DOM level but is practically undiscoverable by users. Several other issues affect reliability and usability.

---

## 🔴 CRITICAL

### F-01 · Typing in Recipes palette search crashes the entire app

**Steps to reproduce:**
1. Go to `/flow`
2. Click the **Recipes** tab in the left palette
3. Wait for recipes to load
4. Type anything in the "Search recipes…" box

**Result:** Runtime error overlay: `Error: factories is not defined` thrown from `FactoryNavigationCard` inside `Sidebar`. Dismissing the overlay leaves a blank white page with "Application error: a client-side exception has occurred while loading localhost."

**Root cause:** When the Recipes tab is selected in the palette, a state change causes the `Sidebar` component to re-render with `factories` undefined. The `FactoryNavigationCard` attempts to iterate over `factories` without a null guard.

**Files to fix:** `src/components/flow/PalettePanel.tsx`, `src/components/Sidebar.tsx`

**Fix:** Add a null/undefined guard in `FactoryNavigationCard` so it renders nothing (or a loading state) when `factories` is undefined. Also investigate why recipe palette tab selection triggers a sidebar re-render.

---

### F-02 · "Delete factory" button deletes immediately with no confirmation

**Steps to reproduce:**
1. Go to `/flow` with factories on the canvas
2. Hover over a factory node — three icon buttons appear in the header
3. Click the rightmost icon (trash — `title="Delete factory"`)

**Result:** The factory and all its production lines are permanently deleted with no dialog, no undo, and no warning. The node disappears from the canvas and the factory is removed from the database instantly.

**Files to fix:** `src/components/flow/FactoryNode.tsx`

**Fix:** Wrap the delete handler in an `AlertDialog` (shadcn/ui) with a message like:
> "Delete **[factory name]**? This will permanently remove the factory and all X production lines. This cannot be undone."
Require the user to click a red "Delete" button to confirm.

---

## 🟠 HIGH

### F-03 · "Double-click to create a new factory" hint is misleading — feature doesn't work

**Steps to reproduce:**
1. Go to `/flow`
2. Read the subtitle: "Drag factories from the sidebar onto the canvas · Double-click to create a new factory"
3. Double-click on empty canvas space

**Result:** React Flow's built-in **zoom-in** behaviour fires instead of the custom "create factory" handler. No factory is created.

**Root cause:** React Flow intercepts `dblclick` for zoom before the custom handler runs. The `onDoubleClick` prop on the `ReactFlow` component needs `e.preventDefault()` and/or the Flow instance's `doubleClickZoom` must be disabled.

**Files to fix:** `src/app/flow/page.tsx` or `src/components/flow/FlowCanvas.tsx`

**Fix:** Either disable `doubleClickZoom` on the `<ReactFlow>` component (`doubleClickZoom={false}`) and implement the create-factory handler properly, or remove the misleading hint text from the header.

---

### F-04 · Node collapse button hides content but node doesn't resize

**Steps to reproduce:**
1. Go to `/flow` with a factory node on the canvas
2. Click the **^** (collapse) button in the node header

**Result:** The production line rows inside the node hide, but the node retains its full original height — leaving a large empty dark rectangle.

**Files to fix:** `src/components/flow/FactoryNode.tsx`

**Fix:** When collapsed, set the node's height to auto or a small fixed value (e.g. just the header height ~40px). React Flow supports dynamic node sizes via `updateNode` or by changing the node's style/className on collapse.

---

### F-05 · Connection handles are invisible and undiscoverable

**Steps to reproduce:**
1. Go to `/flow` with factory nodes that have production lines
2. Try to hover over the left or right edge of a production line row

**Result:** No visual handle appears. The handles exist in the DOM (12×12px React Flow handles) but have no visible hover state — they are effectively transparent. Users cannot tell that dragging from one factory's output to another's input is possible.

**Files to fix:** `src/components/flow/FactoryNode.tsx`

**Fix:** Add CSS to make handles visible on hover:
```css
.react-flow__handle {
  opacity: 0;
  transition: opacity 0.15s;
}
.react-flow__node:hover .react-flow__handle,
.react-flow__handle:hover {
  opacity: 1;
}
```
Also increase handle size to at least 16×16px and add a tooltip: "Drag to connect to another factory".

---

### F-06 · Node header action buttons have no aria-labels (accessibility)

**Steps to reproduce:** Inspect the three icon buttons (collapse, remove from canvas, delete factory) in a node header.

**Result:** The collapse button has no `title` or `aria-label`. The "Remove from canvas" and "Delete factory" buttons have `title` attributes but no `aria-label`. Screen readers cannot announce the purpose of any of these buttons.

**Fix:** Add `aria-label` to all three buttons matching their `title` values.

---

## 🟡 MEDIUM

### F-07 · React Flow "Couldn't create edge" warning on page load

**Console output:**
```
[React Flow]: Couldn't create edge for source handle id:
"pl-out-69d3bc5ee3333b5bd096267c-69d3bf94b5480a7d508935de-Desc_Cement_C"
```

**Cause:** A factory import/connection stored in the database references a production-line handle that no longer exists (the production line was likely deleted or the item changed). The edge silently fails to render — the dependency connection is lost with no indication to the user.

**Fix:** When loading canvas edges, check if their source/target handles exist. If not, show a warning banner: "Some connections could not be displayed because production lines were changed. Please re-link affected factories." Optionally, clean up orphaned import records automatically.

---

### F-08 · Items palette search matches on description text, not just item names

**Steps to reproduce:**
1. Search "iron" in the Items tab

**Result:** Returns items without "iron" in the name: "Excited Photonic Matter", "Mercer Sphere", "Screw", "Steel Ingot". These match because their descriptions mention iron.

**Expected:** Item search should filter primarily by name. Description matches should either be excluded or ranked lower and visually distinguished.

**Fix:** In `PalettePanel.tsx`, filter `item.name.toLowerCase().includes(query)` first; optionally show description matches in a secondary "also found in description" group.

---

### F-09 · Recipes palette shows duplicate entries

**Observed:** "Basic Wall (1 m)" appeared three consecutive times in the recipe list.

**Likely cause:** The recipes API or data import created duplicate records for the same recipe (possibly multiple building sizes or alternate variants with the same display name).

**Fix:** Deduplicate recipes by `className` before rendering in the palette. In the data layer, enforce uniqueness on recipe `className`.

---

### F-10 · Global factory sidebar + Flow palette create dual competing panels (pre-existing)

This is **Fix 20** from the original UX audit. The app-wide factory sidebar is visible on the left while the Flow Editor has its own items/recipes palette. On narrow screens this is especially confusing. The sidebar collapses behind a `<` toggle but defaults open.

**Fix:** Hide the global sidebar on the `/flow` route, or combine the factory list and palette into a single tabbed side panel.

---

## ✅ WORKING CORRECTLY

- Dragging factories from the sidebar onto the canvas ✓
- Canvas pan (drag on empty space) ✓
- Canvas zoom in/out (scroll wheel) ✓
- Fit View / Zoom In / Zoom Out toolbar buttons ✓
- "Remove from canvas" button (removes node from canvas, factory preserved in DB) ✓
- "Drop here or click to add" area opens production line selector ✓
- Production line selector dialog (EnhancedItemRecipeSelector) opens correctly ✓
- Items palette search filters by name (partial match works) ✓
- Canvas state persists across page reloads (node positions saved) ✓
- Node repositioning via drag ✓

---

## Files to Change

| File | Issues |
|------|--------|
| `src/components/flow/PalettePanel.tsx` | F-01 (recipe search crash) |
| `src/components/Sidebar.tsx` | F-01 (null guard for `factories`) |
| `src/components/flow/FactoryNode.tsx` | F-02 (delete confirmation), F-04 (collapse resize), F-05 (handle visibility), F-06 (aria-labels) |
| `src/app/flow/page.tsx` | F-03 (double-click zoom / hint text) |
| `src/components/flow/FlowCanvas.tsx` | F-03 (doubleClickZoom config) |
| `src/app/api/factories/[id]/imports/route.ts` | F-07 (orphaned edge cleanup) |
