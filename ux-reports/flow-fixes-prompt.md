# Flow Page Fixes Prompt — Satisfactory Factories

You are working on a **Next.js 15 App Router** application called **Satisfactory Factories**. Below is a prioritised list of bugs found during a hands-on test of the `/flow` Visual Flow Editor page. Fix all issues in the order listed. After completing each fix, note which file(s) you changed.

The app uses React Flow (`@xyflow/react`), shadcn/ui (Radix UI), Tailwind CSS, and NextAuth.js. The path alias `@/*` maps to `src/*`.

---

## CRITICAL — Fix these first

### Fix F-01 · Typing in Recipes palette search crashes the entire app

**Files:** `src/components/flow/PalettePanel.tsx`, `src/components/Sidebar.tsx`

**Problem:** On the `/flow` page, clicking the **Recipes** tab in the left palette and then typing in the "Search recipes…" box triggers a runtime error:

```
Error: factories is not defined
```

This is thrown from `FactoryNavigationCard` inside `Sidebar`. The error propagates into a full app crash — the page becomes a blank white screen with "Application error: a client-side exception has occurred."

**Root cause:** When the Recipes tab is selected, a state change in `PalettePanel` causes `Sidebar` to re-render. At that point, the `factories` variable is `undefined` and `FactoryNavigationCard` calls `.map()` on it without a null guard.

**Fix:**

1. In `PalettePanel.tsx`, check whether the `onChange` handler or tab state triggers any context/prop changes that would reach `Sidebar`.

2. In `Sidebar.tsx`, find where `factories` is consumed inside `FactoryNavigationCard` or the sidebar factory list. Add a null/undefined guard:

```tsx
// Before
{factories.map(factory => (
  <FactoryNavigationCard key={factory._id} factory={factory} />
))}

// After
{(factories ?? []).map(factory => (
  <FactoryNavigationCard key={factory._id} factory={factory} />
))}
```

3. Also add the guard at every location in the component tree where `factories` is accessed without a check.

**Verification:** Switch to Recipes tab on `/flow`, type "iron plate" — no crash, the search filters the recipe list.

---

### Fix F-02 · "Delete factory" button deletes instantly with no confirmation

**File:** `src/components/flow/FactoryNode.tsx`

**Problem:** The node header in each canvas factory card has a trash icon button (`title="Delete factory"`). Clicking it immediately and permanently deletes the factory and all its production lines — with no confirmation dialog, no undo, and no warning. During testing, a factory with production lines was deleted in one accidental click.

**Fix:**

1. Import `AlertDialog` from shadcn/ui:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
```

2. Wrap the delete button in an `AlertDialog`:

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <button
      title="Delete factory"
      aria-label="Delete factory"
      className="..." // keep existing classes
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete "{data.label}"?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete the factory and all its production lines.
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDeleteFactory}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        Delete factory
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

3. Move the existing delete logic into `handleDeleteFactory`.

**Verification:** Click the trash icon on a factory node — a confirmation dialog appears. Click Cancel — factory remains. Click "Delete factory" — factory is removed.

---

## HIGH PRIORITY

### Fix F-03 · "Double-click to create a new factory" hint doesn't work

**Files:** `src/app/flow/page.tsx` or `src/components/flow/FlowCanvas.tsx`

**Problem:** The page subtitle reads "Drag factories from the sidebar onto the canvas · Double-click to create a new factory". But double-clicking on the canvas triggers React Flow's built-in **zoom-in** behaviour instead of creating a factory. The hint is misleading and the feature doesn't work.

**Fix (option A — preferred):** Disable React Flow's double-click zoom and implement the create-factory handler properly:

```tsx
<ReactFlow
  // ... existing props
  doubleClickZoom={false}
  onDoubleClick={(event) => {
    // Only trigger on empty canvas space, not on nodes
    if ((event.target as HTMLElement).closest('.react-flow__node')) return;
    handleCreateFactory(event);
  }}
>
```

**Fix (option B — minimal):** If implementing the double-click create flow is complex, simply remove the misleading hint from the subtitle:

```tsx
// Change:
"Drag factories from the sidebar onto the canvas · Double-click to create a new factory"

// To:
"Drag factories from the sidebar onto the canvas to add them to your flow"
```

**Verification (option A):** Double-click on empty canvas space → "Add Factory" dialog opens (or a new factory is created inline). Double-clicking a node does not trigger any action.

---

### Fix F-04 · Collapse button hides content but node keeps its full height

**File:** `src/components/flow/FactoryNode.tsx`

**Problem:** Each factory node has a collapse (^) button in its header. Clicking it hides the production line rows, but the node retains its original full height — leaving a large empty dark rectangle on the canvas that wastes space and confuses the layout.

**Fix:**

1. Find the collapse state toggle in `FactoryNode.tsx`.

2. When collapsed, apply a fixed minimum height to the node wrapper and hide the content area:

```tsx
<div
  className={cn(
    "factory-node ...",
    isCollapsed && "!h-auto"  // Let height shrink to just the header
  )}
  style={isCollapsed ? { height: 'auto', minHeight: 'unset' } : undefined}
>
  <div className="node-header ...">
    {/* header always visible */}
  </div>
  {!isCollapsed && (
    <div className="node-content ...">
      {/* production lines, scrollbar, drop zone */}
    </div>
  )}
</div>
```

3. If the node uses React Flow's `NodeResizer`, make sure resizing is disabled or reset when collapsed.

4. After toggling collapse, call `updateNodeInternals(id)` from `useReactFlow()` so React Flow recalculates the node dimensions:

```tsx
import { useReactFlow } from '@xyflow/react';

const { updateNodeInternals } = useReactFlow();

const handleCollapse = () => {
  setIsCollapsed(prev => !prev);
  // Give React one tick to re-render before recalculating
  setTimeout(() => updateNodeInternals(id), 0);
};
```

**Verification:** Click the collapse button — node shrinks to header-only height. Click again — node expands back to full size showing production lines.

---

### Fix F-05 · Connection handles are invisible — users can't discover drag-to-connect

**File:** `src/components/flow/FactoryNode.tsx`

**Problem:** Each production line row has React Flow `Handle` elements (12×12px) on its left edge (inputs) and right edge (outputs), allowing users to drag a connection line between factories. However, these handles have no visible hover state — they're effectively transparent. During testing, users would have no way to know this drag-connect feature exists.

**Fix:**

1. Add visible styling to the handles in `FactoryNode.tsx`. Find the `<Handle>` components and add or update their `className`:

```tsx
// Input (target) handle — left edge
<Handle
  type="target"
  position={Position.Left}
  id={`pl-in-${factoryId}-${pl._id}-${pl.item}`}
  className={cn(
    "!w-3 !h-3 !bg-orange-500 !border-2 !border-orange-300",
    "opacity-0 group-hover/row:opacity-100 hover:!opacity-100",
    "transition-opacity duration-150 cursor-crosshair",
    isCompatible && "!opacity-100 !bg-green-400 !border-green-300 scale-125"
  )}
/>

// Output (source) handle — right edge
<Handle
  type="source"
  position={Position.Right}
  id={`pl-out-${factoryId}-${pl._id}-${pl.item}`}
  className={cn(
    "!w-3 !h-3 !bg-orange-500 !border-2 !border-orange-300",
    "opacity-0 group-hover/row:opacity-100 hover:!opacity-100",
    "transition-opacity duration-150 cursor-crosshair",
    isCompatible && "!opacity-100 !bg-green-400 !border-green-300 scale-125"
  )}
/>
```

2. Add `group/row` to the production line row's wrapper `div` so the Tailwind group-hover works:

```tsx
<div className="... group/row">
```

3. Add a small tooltip on the handles:

```tsx
<Handle ... title="Drag to connect to another factory" />
```

**Verification:** Hover over a production line row — orange dots appear on both the left and right edges. Hovering over a dot shows the tooltip. Dragging from a dot draws a connection line.

---

### Fix F-06 · Node header action buttons have no aria-labels

**File:** `src/components/flow/FactoryNode.tsx`

**Problem:** The three icon buttons in every factory node header (collapse, remove from canvas, delete factory) have no `aria-label`. The collapse button has no `title` either. Screen readers and accessibility tools cannot announce what these buttons do.

**Fix:** Add `aria-label` to all three buttons, matching their intended action:

```tsx
// Collapse/expand button
<button
  aria-label={isCollapsed ? "Expand node" : "Collapse node"}
  title={isCollapsed ? "Expand" : "Collapse"}
  onClick={handleCollapse}
>
  <ChevronUp className={cn("w-4 h-4 transition-transform", isCollapsed && "rotate-180")} />
</button>

// Remove from canvas button
<button
  aria-label="Remove from canvas"
  title="Remove from canvas"
  onClick={handleRemoveFromCanvas}
>
  <EyeOff className="w-4 h-4" />
</button>

// Delete factory button (now wrapped in AlertDialog from Fix F-02)
<AlertDialogTrigger asChild>
  <button
    aria-label="Delete factory"
    title="Delete factory"
  >
    <Trash2 className="w-4 h-4" />
  </button>
</AlertDialogTrigger>
```

**Verification:** Run `axe` or check with a screen reader — all three buttons announce their purpose.

---

## MEDIUM PRIORITY

### Fix F-07 · Orphaned edge warning on page load

**Files:** `src/app/flow/page.tsx` or `src/components/flow/FlowCanvas.tsx`, optionally `src/app/api/factories/[id]/imports/route.ts`

**Problem:** On page load the browser console shows:

```
[React Flow]: Couldn't create edge for source handle id:
"pl-out-...-Desc_Cement_C", edge id: edge-...
```

This means a connection stored in the database references a production line handle that no longer exists (the production line was deleted or its item changed). The edge silently disappears with no user notification — the user loses a dependency link without knowing.

**Fix:**

1. When building the edges array from the factory imports data, validate that each edge's source and target handle IDs still exist in the current set of production lines. If either side is missing, skip the edge and flag it:

```tsx
const validEdges = rawEdges.filter(edge => {
  const sourceExists = allHandleIds.has(edge.sourceHandle);
  const targetExists = allHandleIds.has(edge.targetHandle);
  return sourceExists && targetExists;
});

const orphanedCount = rawEdges.length - validEdges.length;
```

2. If `orphanedCount > 0`, show a dismissible warning banner above the canvas:

```tsx
{orphanedCount > 0 && (
  <div className="bg-yellow-900/60 border border-yellow-600 text-yellow-200 px-4 py-2 text-sm flex items-center gap-2">
    <AlertTriangle className="w-4 h-4 shrink-0" />
    {orphanedCount} connection{orphanedCount > 1 ? 's' : ''} could not be restored
    because production lines were changed. Please re-link the affected factories.
    <button onClick={() => setOrphanWarning(false)} className="ml-auto text-yellow-400 hover:text-white">✕</button>
  </div>
)}
```

**Verification:** Load `/flow` with a factory that has a missing production line connection — warning banner appears. Dismiss it with ✕.

---

### Fix F-08 · Items palette search returns results that don't match the item name

**File:** `src/components/flow/PalettePanel.tsx`

**Problem:** Searching "iron" in the Items tab returns items like "Excited Photonic Matter", "Mercer Sphere", "Screw", and "Steel Ingot" — none of which contain "iron" in their name. The search is matching on the item's description text, which is confusing.

**Fix:** Change the items filter to match on `item.name` only (case-insensitive). Optionally fall back to description matches in a secondary group:

```tsx
const query = search.toLowerCase();

// Primary: name matches
const nameMatches = items.filter(item =>
  item.name.toLowerCase().includes(query)
);

// Optional secondary: description-only matches (shown separately or excluded)
const descriptionOnlyMatches = items.filter(item =>
  !item.name.toLowerCase().includes(query) &&
  item.description?.toLowerCase().includes(query)
);

// Simple approach: only show name matches
const filteredItems = nameMatches;

// Advanced approach: show both groups with a divider
const filteredItems = [
  ...nameMatches,
  ...(descriptionOnlyMatches.length > 0 ? [{ divider: true, label: 'Also in description' }] : []),
  ...descriptionOnlyMatches,
];
```

**Verification:** Search "iron" — only items with "iron" in their name appear (Iron Plate, Iron Ingot, Iron Ore, Iron Rebar, Iron Rod, Reinforced Iron Plate, Iron FICSMAS Ornament).

---

### Fix F-09 · Recipes palette shows duplicate entries

**File:** `src/components/flow/PalettePanel.tsx` or the recipes API route

**Problem:** "Basic Wall (1 m)" appeared three consecutive times in the Recipes tab list. Other recipes may be duplicated too.

**Fix:**

1. In `PalettePanel.tsx`, deduplicate the fetched recipes by `className` before rendering:

```tsx
const uniqueRecipes = Array.from(
  new Map(recipes.map(r => [r.className, r])).values()
);
```

2. Optionally fix the root cause in the data import script (`src/app/api/admin/import-data/route.ts`) by using MongoDB's `upsert` on `className` instead of insert:

```ts
await Recipe.findOneAndUpdate(
  { className: recipe.className },
  recipe,
  { upsert: true, new: true }
);
```

**Verification:** Open the Recipes tab — scroll through the list and confirm no recipe name appears more than once.

---

## LOW PRIORITY

### Fix F-10 · Global factory sidebar overlaps the Flow page palette

**Files:** `src/components/Sidebar.tsx`, `src/app/flow/page.tsx` or `src/app/layout.tsx`

**Problem:** On the `/flow` page, the global factory sidebar (which lists all factories for navigation) is displayed on the left at the same time as the Flow Editor's own Items/Recipes palette panel. This creates two competing left-side panels and wastes horizontal space. On smaller screens they overlap significantly.

**Fix:** Detect the current route inside the global `Sidebar` and hide it when on `/flow`:

```tsx
// src/components/Sidebar.tsx
'use client';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  // Hide global sidebar on the Flow page — it has its own palette
  if (pathname === '/flow') return null;

  // ... rest of sidebar
}
```

Alternatively, keep the sidebar but show only the factory list (no items/recipes) inside it on `/flow`, and have the palette panel show inside the React Flow canvas wrapper instead of as a separate sibling element.

**Verification:** Navigate to `/flow` — only the Flow Editor's palette panel is visible on the left. Navigate to `/` (Planner) — the factory sidebar reappears normally.

---

## Reference: All changed files

| Fix | File(s) |
|-----|---------|
| F-01 | `src/components/flow/PalettePanel.tsx`, `src/components/Sidebar.tsx` |
| F-02 | `src/components/flow/FactoryNode.tsx` |
| F-03 | `src/app/flow/page.tsx` or `src/components/flow/FlowCanvas.tsx` |
| F-04 | `src/components/flow/FactoryNode.tsx` |
| F-05 | `src/components/flow/FactoryNode.tsx` |
| F-06 | `src/components/flow/FactoryNode.tsx` |
| F-07 | `src/app/flow/page.tsx` / `src/components/flow/FlowCanvas.tsx` |
| F-08 | `src/components/flow/PalettePanel.tsx` |
| F-09 | `src/components/flow/PalettePanel.tsx`, `src/app/api/admin/import-data/route.ts` |
| F-10 | `src/components/Sidebar.tsx` |
