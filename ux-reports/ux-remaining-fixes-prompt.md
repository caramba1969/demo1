# UX Remaining Fixes Prompt — Satisfactory Factories

You are working on a **Next.js 15 App Router** application called **Satisfactory Factories**. A UX audit was performed and 20 fixes were proposed. A second verification pass confirmed **10 are fully fixed** and **10 still need work** — 5 not fixed at all, 5 partially fixed. This prompt covers **only the remaining work**. Fix all items in the order listed. After each fix note the file(s) changed.

---

## CRITICAL — Fix these first

### Fix 1 · "Resource Extraction" tab — invisible text
**File:** `src/components/EnhancedItemRecipeSelector.tsx`

The inactive "Resource Extraction" tab still has near-white text on a white/near-white background. Computed colour is `oklch(0.929)` on `oklch(1.0)` — WCAG contrast fails.

- Find the tab switcher that toggles "Recipe Production" vs "Resource Extraction"
- The **active** tab should have white text on the orange/primary background
- The **inactive** tab should use `text-slate-400` (or similar dark muted colour) so it is always readable
- Do NOT use `text-white` on an inactive tab; it must have contrast ratio ≥ 4.5:1 against its background

---

### Fix 2 · "Back" and "Cancel" buttons — invisible text
**File:** `src/components/EnhancedItemRecipeSelector.tsx`

The "← Back" and "Cancel" buttons across all three steps of the production line selector appear as blank white rectangles. Computed text colour is `oklch(0.97)` on `oklch(1.0)`.

- These buttons use a `variant="outline"` or `variant="ghost"` shadcn/ui Button in a dark panel context
- Add `className="text-slate-200 border-slate-500 hover:bg-slate-700"` to each Back/Cancel button — or switch to `variant="secondary"`
- Test all three steps (Select Item → Choose Recipe → Set Quantity) and confirm both buttons show readable text in every step

---

### Fix 3 · Create Factory form — no validation on empty name
**File:** `src/components/AddFactoryDialog.tsx`

Clicking "Create Factory" with an empty name silently closes or does nothing — no error, no border highlight, no message.

- Add client-side validation: if `name.trim() === ''`, prevent the API call
- Show an inline error **below** the name input: `"Factory name is required"` in `text-red-400`
- Add `border-red-500` to the input on error
- Clear the error as soon as the user starts typing (`onChange`)
- Keep the "Create Factory" button **enabled** so the user understands they must fill in the field

---

## HIGH PRIORITY

### Fix 4 (complete) · Upgrade icon-button tooltips from `title` to Radix UI `<Tooltip>`
**Files:** `src/components/FactorySection.tsx`, `src/components/ProductionLineCard.tsx`

`title` attributes were added but native browser tooltips appear inconsistently and with no styling. The rest of the app uses Radix UI.

- Import `Tooltip, TooltipContent, TooltipTrigger` from `src/components/ui/tooltip.tsx`
- Wrap every icon-only button in both files inside `<Tooltip><TooltipTrigger asChild>…</TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>`
- Remove the now-redundant `title` attribute from each button
- Labels to use:
  - FactorySection header: "Move up", "Move down", "Lock", "Save changes", "Delete factory"
  - ProductionLineCard: "Collapse", "Active", "Edit", "Delete production line"

---

## MEDIUM PRIORITY

### Fix 8 (complete) · Sidebar factory count badge — correct tooltip text
**File:** `src/components/Sidebar.tsx`

A `title` attribute was added but the text reads "1 factories need attention" instead of the required format.

- Change the badge tooltip to: `"${satisfiedCount} of ${totalCount} factories have all dependencies satisfied"`
- Replace the native `title` attribute with a Radix UI `<Tooltip>` for consistency
- Calculate `satisfiedCount` by checking which factories have zero missing dependencies

---

### Fix 9 (complete) · Production line card — add building type subtitle fallback
**File:** `src/components/ProductionLineCard.tsx`

The duplicate title/subtitle was removed, but when recipe name equals item name the card shows no subtitle at all.

- When `recipe.name === item.name` (standard recipe), display the building type as subtitle (e.g. "Constructor Mk1")
- Source the building type from `productionLine.buildingType` — it is already stored on the model
- If `buildingType` is also undefined, show nothing (current behaviour)
- Style the subtitle in `text-sm text-slate-400` below the item name

---

### Fix 12 (complete) · Locations page — move "Back to Factories" link to top
**File:** `src/app/locations/page.tsx`

The sidebar was added, but "Back to Factories" is still buried at the bottom of the page content.

- Move the "← Back to Factories" link to immediately below the page `<h1>` heading, before the location list/cards
- Or remove it entirely — the factory sidebar in the layout makes it redundant

---

### Fix 17 (complete) · Dependency tracker — upgrade tooltips to Radix UI
**File:** `src/components/DependencyTracker.tsx`

`title` attributes were added to the Refresh and Pause buttons, but no Radix UI Tooltip was applied.

- Replace `title="Refresh dependencies"` with `<Tooltip><TooltipTrigger asChild>…</TooltipTrigger><TooltipContent>Refresh now</TooltipContent></Tooltip>`
- Do the same for the pause/resume button: tooltip text should switch between `"Pause auto-refresh"` and `"Resume auto-refresh"` based on the current state
- When auto-refresh is paused, also update the banner subtitle text to say "Auto-refresh paused" instead of showing a countdown timer

---

## LOW PRIORITY / POLISH

### Fix 14 · Raw class names in Recipe Database
**Files:** `src/app/recipes/page.tsx` (or wherever recipe names are displayed)

Raw Unreal Engine class name strings such as `Desc_ResourceSinkShop_C`, `Desc_ResourceSink_C`, `Desc_AlienPowerBuilding_C` are still visible as product names on recipe cards — 24+ instances confirmed.

- Add a utility function (e.g. in `src/lib/utils.ts`):

```ts
export function humanizeClassName(name: string): string {
  // Strip Desc_ prefix and _C suffix, split PascalCase into words
  return name
    .replace(/^Desc_/, '')
    .replace(/_C$/, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}
```

- Apply this function wherever an item/recipe `name` is rendered: if `name` matches `/^Desc_.*_C$/`, replace it with `humanizeClassName(name)`
- Also apply to building type strings that show raw class names (e.g. `B P_Build Gun_C`)
- Ideally apply the transform in the data import pipeline so it is stored clean, not just at display time

---

### Fix 19 · Graph canvas — auto-fit on load + "Fit to screen" button
**File:** `src/components/FactoryDependencyGraph.tsx`

When the graph loads, factory nodes are scattered and the canvas is not centred. No "Fit to screen" button exists.

- After the D3 force simulation settles (`simulation.on("end", ...)`) call a zoom-to-fit function:
  ```ts
  // After simulation ends, fit all nodes in the viewport
  const bounds = svg.node()!.getBBox();
  const fullWidth = width, fullHeight = height;
  const scale = 0.85 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
  const translate = [
    fullWidth / 2 - scale * (bounds.x + bounds.width / 2),
    fullHeight / 2 - scale * (bounds.y + bounds.height / 2),
  ];
  svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale));
  ```
- Add a "Fit to screen" button to the existing toolbar (alongside Refresh, Zoom In, Zoom Out, Reset)
- The button should call the same fit function on click

---

## BONUS — Not in original prompt, found during verification

### Bonus A · Factory section header — make sticky while scrolling
**File:** `src/components/FactorySection.tsx`

The factory header (title + Move Up/Down/Lock/Save/Delete buttons) scrolls out of view when there are many production lines. Users must scroll back to the top to access these controls.

- Add `sticky top-0 z-10 bg-slate-900` (or whatever the page background colour is) to the factory section header `<div>`
- Ensure the sticky header has a bottom border or shadow so it visually separates from the content below when sticking: `border-b border-slate-700 shadow-sm`

---

### Bonus B · Save production line — add success toast notification
**Files:** `src/components/ProductionLineCard.tsx`, `src/app/layout.tsx`

After saving a production line edit, there is no feedback — the form just returns to read-only mode silently.

- Install `sonner`: `npm install sonner`
- Add `<Toaster />` from `sonner` to `src/app/layout.tsx`
- In `ProductionLineCard.tsx`, after a successful save API call, call `toast.success("Production line saved")`
- On error, call `toast.error("Failed to save — please try again")`

---

## General Notes

- All components use **Tailwind CSS** and **shadcn/ui** (Radix UI primitives)
- The Radix `Tooltip` wrapper component is at `src/components/ui/tooltip.tsx` — use it everywhere instead of native `title` attributes
- `humanizeClassName()` and any other new utilities go in `src/lib/utils.ts`
- After every fix, run `npm run lint` and `npm run build` to confirm no TypeScript or ESLint errors
