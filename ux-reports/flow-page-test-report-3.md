# Flow Page — UX Test Report (Updated)
**Page:** `/flow` — Visual Flow Editor  
**Tested:** 2026-04-11  
**Tester:** GitHub Copilot (automated code audit)  
**Previous report:** `flow-page-test-report-2.md` (2026-04-11)  
**React Flow version:** `@xyflow/react` ^12.10.2

---

## Executive Summary

Since the last report, **three additional issues are now resolved**: F-09 duplicate recipes in the palette UI, F-10 sidebar collision, and F-03 double-click factory creation (a popover is now implemented). However, F-04 (collapse height) is only partially fixed and still breaks for manually resized nodes. NEW-01 (edges not rendering) may have improved due to the `validEdges` filter added in `FlowCanvas.tsx`, but the root race condition between React Flow's internal handle registration and `setEdges` has not been definitively fixed. Two new bugs were identified, including a critical loading spinner that never resolves for users with no factories.

---

## Status of Previously Reported Issues

### ✅ FIXED

#### F-09 · Duplicate recipes in Recipes palette
**Status: FIXED (display layer).** `PalettePanel.tsx` now deduplicates by display name using a `Set<string>` before rendering. "Basic Wall (1 m)" will no longer appear multiple times.  
**Note:** The root cause — duplicate `className` entries in the MongoDB `recipes` collection from the data import script — is still unfixed. The fix is purely client-side. If any two genuinely different recipes share the same display name, one will be silently hidden.

#### F-10 · Global factory sidebar visible on `/flow` page
**Status: FIXED.** Code review confirms the `<Sidebar>` component is only rendered by `src/app/page.tsx` (home page). The root layout (`src/app/layout.tsx`) only renders `<TopNav>`. The flow page renders its own `<PalettePanel>` absolutely positioned inside the canvas container. No sidebar collision occurs.

#### F-03 · Double-click to create factory
**Status: PARTIALLY FIXED.** A `handleCanvasDoubleClick` handler now opens a named-factory popover at the click position (`FlowCanvas.tsx`). The handler correctly guards to only fire on `react-flow__pane` or background elements.  
**Remaining issue:** React Flow's built-in `doubleClickZoom` is still active (no `doubleClickZoom={false}` prop on `<ReactFlow>`). Both the popover AND the zoom fire simultaneously on double-click — see **NEW-03** below.

---

### ❌ STILL BROKEN

#### F-04 · Collapse button — node keeps full height (for resized nodes)
**Status: PARTIALLY FIXED.** `FactoryNode.tsx` lines 57–62 now call `updateNodeInternals(id)` inside `setTimeout(..., 0)` after `expanded` changes — exactly the fix recommended in the previous report. For nodes that have never been manually resized, the `h-fit` class on the inner div should allow the React Flow wrapper to shrink.

**Root cause of remaining failure:** When a user manually resizes a node using `NodeResizer`, React Flow stores an explicit pixel height in the node's `style` property (e.g., `style: { width: 480, height: 620 }`). This height is persisted to `localStorage` via `saveSizes()`. On collapse, `updateNodeInternals(id)` triggers remeasurement but does NOT clear `style.height` — so React Flow's wrapper retains the fixed pixel height, and `h-fit` on the inner div is irrelevant.

**Files:** `src/components/flow/FactoryNode.tsx` (line 57), `src/components/flow/useFlowData.ts` (`saveSizes`, `getStoredSizes`)

**Fix:** In `FactoryNode.tsx`, when collapsing, also call `updateNode(id, { style: { width: currentWidth } })` (clearing `height`) before `updateNodeInternals`. This requires importing `useReactFlow` and calling `updateNode`. Alternatively, store only width in `localStorage` and never restore height.

---

#### NEW-01 · Saved connections don't render as edges on canvas
**Status: IMPROVED but root race condition unresolved.** The `validEdges` filter in `FlowCanvas.tsx` (lines ~314–325) now correctly prevents edges from being passed to `<ReactFlow>` until their source and target handles exist in `validHandleIds`. This prevents the "Couldn't create edge" warning from firing for edges whose handles don't yet exist.

**However**, there is still a timing race:
1. `loadAll()` in `useFlowData.ts` calls `setNodes(updatedWithLines)` then, after awaiting all factory imports, calls `setEdges(allEdges)`.
2. React Flow's `<Handle>` component registers handles in its own internal registry asynchronously (via `useEffect` on mount).
3. When `setEdges` fires and triggers a render, `validHandleIds` is populated from the current node data — but React Flow's _internal_ handle registry (used for edge path calculation) may not yet have the handle registered if the `Handle` component's `useEffect` hasn't fired.
4. If React Flow receives an edge referencing an unregistered handle, it logs "Couldn't create edge" and the edge path is not drawn, even though the state is correct.

**Files:** `src/components/flow/useFlowData.ts` (`loadAll`, lines ~185–245), `src/components/flow/FlowCanvas.tsx` (`validEdges`, lines ~314–325)

**Fix:** After `setEdges(allEdges)`, call `updateNodeInternals` for all canvas factory IDs (from `useReactFlow`) inside a `setTimeout(..., 50)` to allow handles to mount before React Flow processes the edges. Alternatively, use `useEffect` with a dependency on `edges.length` to trigger `updateNodeInternals` for all nodes when edges are first set.

---

## 🔴 NEW CRITICAL

### NEW-02 · Authenticated users with zero factories see infinite loading spinner

**Steps to reproduce:**
1. Sign in with a fresh account that has no factories.
2. Navigate to `/flow`.

**Result:** The loading spinner (`<Loader2>`) continues indefinitely. The page never renders the canvas or a "no factories yet" state.

**Root cause:** In `src/app/flow/page.tsx` (line ~30–37), `setIsLoading(false)` is only called inside a `useEffect` that guards on `flowData.allFactories.length > 0`:
```tsx
useEffect(() => {
  if (flowData.allFactories.length > 0) {
    setSidebarFactories(...);
    setIsLoading(false);  // ← never reached if 0 factories
  }
}, [flowData.allFactories]);
```
When the API returns `[]`, `setAllFactories([])` is called in `useFlowData.ts`. The flow page effect fires (array reference changed) but the `length > 0` guard prevents `setIsLoading(false)`. The second `useEffect` (lines ~40–43) only sets `isLoading(false)` for `unauthenticated` users.

**Files:** `src/app/flow/page.tsx` (lines ~30–43)

**Fix:**
```tsx
useEffect(() => {
  // allFactories is populated (even if empty) after loadAll completes
  setSidebarFactories(
    flowData.allFactories.map(f => ({ id: f._id, name: f.name, order: f.order ?? 0, tasks: [], notes: [] }))
  );
  setIsLoading(false);
}, [flowData.allFactories]);
```
Remove the `length > 0` guard — simply always sync `allFactories` to sidebar state and clear loading.

---

## 🟠 NEW HIGH

### NEW-03 · Double-click zoom fires simultaneously with factory creation popover

**Steps to reproduce:**
1. Go to `/flow` with the canvas visible.
2. Double-click on empty canvas space.

**Result:** The factory-name popover opens correctly at the click position. However, React Flow's built-in double-click zoom also fires at the same time, zooming the canvas in by one step. The popover position becomes misaligned with the intended factory position because the viewport has changed mid-interaction.

**Root cause:** `FlowCanvas.tsx` wraps `<ReactFlow>` in a `<div onDoubleClick={handleCanvasDoubleClick}>`. React Flow's internal `doubleClickZoom` prop defaults to `true` and registers its own listener on the pane element. Both handlers receive the same event. The `handleCanvasDoubleClick` handler does not call `event.preventDefault()` or `event.stopPropagation()`, so React Flow's zoom fires unchecked.

**Files:** `src/components/flow/FlowCanvas.tsx` (line ~387, `<ReactFlow>` props)

**Fix:** Add `doubleClickZoom={false}` to the `<ReactFlow>` component:
```tsx
<ReactFlow
  ...
  doubleClickZoom={false}
  ...
>
```

---

## 🟡 NEW MEDIUM

### NEW-04 · Duplicate recipe data in MongoDB not deduplicated at import

**Status:** Previously reported as F-09 and resolved at the display layer. The underlying data issue remains: duplicate `className` entries exist in the `recipes` collection. Any future search endpoint that bypasses the palette's client-side deduplication (e.g., the `EnhancedItemRecipeSelector` used when adding production lines) may still expose duplicates to users.

**Files:** `src/lib/importSatisfactoryData.ts` (import script), `/api/admin/import-data` route

**Fix:** In the import script, use MongoDB's `upsert` via `updateOne({ className }, ..., { upsert: true })` instead of `insertMany`, or add a unique index on `className` in the `Recipe` model to prevent duplicates at the database level.

---

## Known Issue Status Summary

| ID | Issue | Status |
|----|-------|--------|
| F-01 | Recipe search crash | ✅ Fixed |
| F-02 | Delete with no confirmation | ✅ Fixed |
| F-03 | Double-click factory creation | ⚠️ Partially fixed (zoom fires too) |
| F-04 | Collapse height regression | ⚠️ Partially fixed (fails for resized nodes) |
| F-06 | Missing aria-labels | ✅ Fixed |
| F-07 | "Couldn't create edge" warning loop | ⚠️ Mitigated by validEdges filter |
| F-08 | Items search spurious results | ✅ Fixed |
| F-09 | Duplicate recipes in palette | ✅ Fixed (display only) |
| F-10 | Global sidebar on flow page | ✅ Fixed |
| NEW-01 | Edges don't render after reload | ⚠️ Partially mitigated, race condition remains |
| NEW-02 | Infinite spinner for 0 factories | 🔴 New — unfixed |
| NEW-03 | Double-click zoom on factory create | 🟠 New — unfixed |
| NEW-04 | Duplicate recipes in MongoDB | 🟡 New — unfixed |
