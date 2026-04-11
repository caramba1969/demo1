# Flow Page — UX Test Report (Updated)
**Page:** `/flow` — Visual Flow Editor  
**Tested:** 2026-04-11  
**Tester:** Claude (automated browser audit)  
**Previous report:** `flow-page-test-report.md` (2026-04-06)

---

## Executive Summary

Compared to the previous report, **three of the six original critical/high issues have been fixed** (F-01 crash, F-02 delete confirmation, F-06 aria-labels). The Items palette search now filters correctly by name. However, a **new critical bug** was discovered: saved connections never render as visible edges on the canvas. The collapse-height bug and duplicate recipes remain unfixed.

---

## Status of Previously Reported Issues

### ✅ FIXED

#### F-01 · Recipe search no longer crashes the app
Clicking the **Recipes** tab in the left palette and typing in the search box no longer causes a runtime crash or blank screen. The app remains stable throughout.

#### F-02 · Delete factory now requires confirmation
Clicking the trash icon on a factory node opens an `AlertDialog` showing the factory name, a warning ("This will permanently delete the factory and all its production lines. This action cannot be undone."), a **Cancel** button, and a red **Delete factory** button. Cancel correctly dismisses without deleting.

#### F-06 · Node header buttons now have aria-labels
All three header buttons (collapse/expand, remove from canvas, delete factory) have both `title` and `aria-label` attributes. The collapse button dynamically switches between "Collapse factory" / "Expand factory".

#### F-08 · Items palette search now filters by name only
Searching "iron" returns only name-matching results: Iron FICSMAS Ornament, Iron Ingot, Iron Ore, Iron Plate, Iron Rebar, Iron Rod, Reinforced Iron Plate. No spurious description-matched items appear.

---

### ❌ STILL BROKEN

#### F-04 · Collapse button — node keeps full height
**Status: Unchanged.** Clicking the collapse (^) button hides all production line rows, but the node retains its full original height, leaving a large empty dark rectangle on the canvas.

**Root cause (confirmed by code review):** `FactoryNode.tsx` toggles `expanded` state and conditionally renders content, but React Flow is not told to re-measure the node. `updateNodeData(id, {})` is called inside a `useEffect` on `expanded` changes, but this does not trigger React Flow to recalculate node dimensions. The outer div uses `h-full` when expanded and `h-fit` when collapsed, but React Flow's node wrapper retains a fixed size from the initial render.

**Fix:** Call `updateNodeInternals(id)` (not `updateNodeData`) after toggling collapse, inside a `setTimeout(..., 0)` to allow the DOM to re-render first.

---

#### F-07 · "Couldn't create edge" warning fires continuously
**Status: Unchanged.** React Flow logs the following on every render cycle:
```
[React Flow]: Couldn't create edge for source handle id:
"pl-out-69d3bc5ee3333b5bd096267c-69d3bf94b5480a7d508935de-Desc_Cement_C",
edge id: edge-69d3c3b2e0218c38096c8a37
```
The `validEdges` filter in `FlowCanvas.tsx` (lines 314–318) correctly checks handle validity, and the handle **does exist in the DOM** (confirmed via `getBoundingClientRect`). However, React Flow's internal handle registry does not contain it, so edges referencing it cannot be rendered. This is the root cause of NEW-01 below.

---

#### F-09 · Duplicate recipes in Recipes palette
**Status: Unchanged.** "Basic Wall (1 m)" appears 3 consecutive times, "Basic Wall (4 m)" also appears 2–3 times. The data import script does not deduplicate on `className`.

---

#### F-10 · Global factory sidebar visible alongside flow palette
**Status: Unchanged.** The global app sidebar remains visible on `/flow`, competing with the Items/Recipes palette for left-side space.

---

## 🔴 NEW CRITICAL BUG

### NEW-01 · Connections save to DB but never render as edges on canvas

**Steps to reproduce:**
1. Go to `/flow` with two factory nodes that share a compatible item (e.g. both have a Concrete production line)
2. Drag from the orange output handle of a production line to the blue input handle of another factory's production line

**Result:**
- The **"Create Connection" dialog opens correctly** — showing source→target factory names, item name, required amount, and source rate
- Clicking **Connect** calls `POST /api/factories/{targetId}/imports` → returns **200 OK**
- `addImportEdge()` is called in `FlowCanvas.tsx` to add the edge to React Flow state
- **No edge line appears on the canvas**
- After **page reload**, the edge still does not appear
- React Flow logs "Couldn't create edge for source handle id: …" for every saved connection that references the Concrete production line output

**Root cause (identified by code review):**

The production line `Handle` components (`FactoryNode.tsx`, `ProductionLineRow`) are rendered inside a `<div className="overflow-y-auto overflow-x-hidden ...">` scroll container. The handles are positioned at `!-left-2.5` / `!-right-2.5` (10px outside their row bounds). While the outer node div uses `overflow-visible`, the inner scroll container has `overflow-x-hidden`, which clips the handle elements relative to their React Flow stacking context.

React Flow registers handles via an internal store as they mount. Handles inside a clipped/overflow-hidden ancestor may not correctly complete registration in React Flow's handle registry — even though they appear in the DOM and have valid `getBoundingClientRect` values. This means the handles exist visually but React Flow cannot use them to draw or validate edges.

**Files to fix:** `src/components/flow/FactoryNode.tsx`

**Fix:**
1. Remove `overflow-x-hidden` from the scroll container, or increase its width to accommodate the `!-left-2.5` / `!-right-2.5` handle offsets
2. Alternatively, use `overflow: clip` with `overflow-clip-margin` instead of `overflow-x-hidden` to allow handle hit-testing while preventing visible scroll
3. Ensure the `.react-flow__node` wrapper (and any intermediate ancestors) allows `overflow: visible` for handle registration

---

## 🟠 NEW HIGH BUG

### NEW-02 · Recipe palette search does not filter results

**Steps to reproduce:**
1. Go to `/flow`
2. Click the **Recipes** tab in the left palette
3. Type in the search box

**Result:** The recipe list shows all recipes regardless of what is typed. The search input updates visually but the filter does not apply.

**Note:** Items tab search works correctly. The bug appears to be specific to the Recipes tab filter logic in `PalettePanel.tsx`.

**Files to fix:** `src/components/flow/PalettePanel.tsx`

**Fix:** Verify that the Recipes tab uses the same filter logic as the Items tab, applying `recipe.name.toLowerCase().includes(searchQuery.toLowerCase())` to filter results before rendering.

---

## ✅ WORKING CORRECTLY (confirmed this session)

| Feature | Status |
|---|---|
| Page loads with factory nodes on canvas | ✅ |
| Canvas pan (drag on empty space) | ✅ |
| Canvas zoom (scroll wheel) | ✅ |
| Fit View / Zoom In / Zoom Out toolbar buttons | ✅ |
| Factory node rendering (stats bar, production lines, handles) | ✅ |
| Orange output handles visible on production line rows | ✅ |
| Blue input handles visible on production line rows | ✅ |
| Handle hover effects (scale up, shadow glow) | ✅ |
| Connection dialog opens when connecting compatible handles | ✅ |
| Connection dialog shows correct factory names, item, rate | ✅ |
| Connection API call (`POST .../imports`) returns 200 | ✅ |
| "Remove from canvas" (node removed, factory kept in DB) | ✅ |
| Delete confirmation dialog (F-02) | ✅ |
| Collapse/expand toggle (content visibility toggles) | ✅ (height bug remains) |
| "Drop here or click to add" opens production line selector | ✅ |
| Items palette search filters by name | ✅ |
| Node header button aria-labels (F-06) | ✅ |
| No crash on recipe tab + search (F-01) | ✅ |

---

## Priority Fix Order

| Priority | Issue | File |
|---|---|---|
| 🔴 Critical | NEW-01: Edges never render (overflow-x-hidden clips handle registry) | `FactoryNode.tsx` |
| 🟠 High | NEW-02: Recipe search doesn't filter | `PalettePanel.tsx` |
| 🟠 High | F-04: Collapse keeps full node height | `FactoryNode.tsx` |
| 🟡 Medium | F-09: Duplicate recipes | `PalettePanel.tsx`, import route |
| 🟡 Medium | F-07: Orphaned edge warning (resolved by fixing NEW-01) | `FlowCanvas.tsx` |
| 🟢 Low | F-10: Dual sidebars on /flow | `Sidebar.tsx` |
