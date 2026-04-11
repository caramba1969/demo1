# UX Fixes Prompt — Satisfactory Factories

You are working on a **Next.js 15 App Router** application called **Satisfactory Factories** — a factory planning tool for the game Satisfactory. Below is a prioritised list of UX bugs and improvements identified during a hands-on audit. Fix all issues in the order listed. After completing each fix, note what file(s) you changed.

---

## CRITICAL — Fix these first

### Fix 1 · "Resource Extraction" tab has invisible text
**File:** `src/components/EnhancedItemRecipeSelector.tsx`

The second tab in the production line selector (labelled "Resource Extraction") renders with white text on a white/light background, making it completely unreadable.

- Find the tab switcher that toggles between "Recipe Production" and "Resource Extraction"
- The inactive tab likely uses a CSS class or variant that sets `color: white` or `text-white` while its background is also light
- Ensure the inactive tab uses a dark or muted text colour (e.g. `text-slate-400`) and the active tab uses white text on the orange/primary background
- Both tabs must have sufficient contrast in both active and inactive states

---

### Fix 2 · "Back" and "Cancel" buttons have invisible text
**File:** `src/components/EnhancedItemRecipeSelector.tsx`

Throughout the 3-step production line selector, the "← Back" and "Cancel" navigation buttons appear as blank white rectangles — their text colour matches their background.

- Locate the Back and Cancel button elements across all three steps (Select Item, Choose Recipe, Set Quantity)
- These buttons are likely using a `variant="outline"` or `variant="ghost"` shadcn/ui button on a dark background panel, causing text to disappear
- Fix the text colour so it is always visible against the panel background — e.g. use `variant="secondary"` or explicitly set `className="text-slate-200 border-slate-600"` on the dark-background context
- Test all three steps confirm both buttons are clearly readable

---

### Fix 3 · Create Factory form gives no feedback on empty submission
**File:** `src/components/AddFactoryDialog.tsx`

Clicking "Create Factory" with an empty name field silently fails — the dialog stays open with no error message, no field highlighting, and no indication of what went wrong.

- Add client-side validation: if the factory name field is empty or whitespace-only, prevent submission
- Display an inline error message below the name field, e.g. `"Factory name is required"` in red (`text-red-400`)
- Add a red border to the input field on error: `border-red-500`
- Clear the error state as soon as the user starts typing
- The "Create Factory" button should remain enabled (do not just disable it — the user needs to know *why* it's disabled)

---

## HIGH PRIORITY

### Fix 4 · Icon-only action buttons in factory header have no tooltips
**File:** `src/components/FactorySection.tsx`

The factory detail header contains five small icon buttons (Move Up, Move Down, Lock/Unlock, Save, Delete) with no labels and no tooltips. Users cannot discover their purpose without clicking.

- Wrap each icon button with a Radix UI `Tooltip` (already available via shadcn/ui)
- Tooltip labels: "Move up", "Move down", "Lock / Unlock", "Save changes", "Delete factory"
- The Delete button tooltip should use a warning tone: "Delete factory (cannot be undone)"
- Apply the same tooltip treatment to the icon-only buttons on `ProductionLineCard.tsx` (collapse, active toggle, edit, delete)

---

### Fix 5 · "Actual Output" shows target value when inputs are missing
**File:** `src/components/ProductionLineCard.tsx`

When a production line has unsatisfied ingredient dependencies, the "Actual Output" metric still displays the full target production rate (e.g. 60.0 items/min) instead of 0.

- In the `ProductionLineCard` component, check whether all required ingredients have their `availableInput >= requiredAmount`
- If any ingredient is unsatisfied, display `0.0 items/min` for Actual Output (or the proportionally reduced rate based on the bottleneck ingredient)
- Visually distinguish the unsatisfied state: display Actual Output in red/amber when it differs from Target Output
- Add a small warning icon (⚠) next to the Actual Output value when inputs are missing

---

### Fix 6 · Large numbers are not formatted
**Files:** `src/components/DependencyTracker.tsx`, `src/components/ProductionLineCard.tsx`, `src/components/ImportsList.tsx`, `src/components/ExportsList.tsx`

Numbers like `1200000.0/min` are displayed without thousands separators, making them very hard to read.

- Create a shared utility function `formatRate(value: number): string` in `src/lib/utils.ts`:
  ```ts
  export function formatRate(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return new Intl.NumberFormat().format(Math.round(value));
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  }
  ```
- Apply `formatRate()` to every production rate displayed across the app (dependency tracker, production line cards, imports list, exports list, factory exports section)

---

### Fix 7 · Recipe Database loads all 872 recipes at once
**File:** `src/app/recipes/page.tsx`

The page fetches and renders all recipes simultaneously with no pagination, causing slow loads and a confusing "Showing 0 of 0 recipes" flash before data arrives.

- Add client-side pagination: display 48 recipes per page with Previous/Next controls
- While data is loading, show a skeleton loader or spinner instead of "Showing 0 of 0 recipes" — only render the count once data has loaded (`isLoading` guard)
- Add a page indicator: "Page 2 of 19" or "Showing 49–96 of 872 recipes"

---

## MEDIUM PRIORITY

### Fix 8 · Sidebar counter badge has no explanation
**File:** `src/components/Sidebar.tsx`

The badge showing `0/2 ✓` has no tooltip or legend. Users do not know it means "satisfied factories / total factories".

- Add a Radix UI `Tooltip` to the badge with the text: `"X of Y factories have all dependencies satisfied"`
- Update the badge dynamically with the correct counts

---

### Fix 9 · Production line card title and subtitle show identical text
**File:** `src/components/ProductionLineCard.tsx`

The card header repeats the item name as both the title and subtitle (e.g. "Iron Plate / Iron Plate").

- The subtitle should display the **recipe name**, not the item name
- If the recipe name and item name are identical (standard recipe), show the building type instead (e.g. "Constructor Mk1")
- If using an alternate recipe, show the full alternate recipe name (e.g. "Alternate: Coated Iron Plate")

---

### Fix 10 · Cryptic "(pct X.X - X.X exports)" text in production line footer
**File:** `src/components/ProductionLineCard.tsx`

The production line summary footer shows text like `Produces: 0.0/min (pct 60.0 - 60.0 exports)` which is an internal notation that users cannot interpret.

- Replace the parenthetical with plain English: `Produces: 0.0/min (60.0 produced − 60.0 exported)`
- Or, if the net production is 0 due to full export, show: `Produces: 60.0/min → fully exported`
- Remove any raw variable names or formula notation from the displayed text

---

### Fix 11 · Changelog page uses wrong background colour and loses sidebar
**File:** `src/app/changelog/page.tsx`

The Changelog page renders on a solid black (`#000000`) background while every other page uses dark navy (`#0F172A` / `bg-slate-900`). The sidebar is also absent.

- Apply the app-standard dark background to the changelog page: `bg-slate-900` or `bg-neutral-900` (match whatever the root layout uses)
- Wrap the page content in the same layout component that other content pages use so the factory sidebar is present
- Ensure the text contrast and spacing is consistent with the rest of the app

---

### Fix 12 · Locations page loses sidebar and buries "Back to Factories"
**File:** `src/app/locations/page.tsx`

The Locations Management page does not render the factory sidebar (unlike other pages), and the only navigation link back is "Back to Factories" at the bottom of the page content.

- Apply the app root layout so the sidebar is visible on the Locations page (consistent with Planner, Recipes, Graph)
- Move the "Back to Factories" link to the top of the page, near the page title — or remove it entirely if the sidebar makes it redundant
- Constrain the location cards to a max-width that looks intentional (e.g. `max-w-3xl`) rather than leaving them as a small card on the left of a large black canvas

---

### Fix 13 · Graph nodes are not clickable
**File:** `src/components/FactoryDependencyGraph.tsx` (or `src/app/graph/page.tsx`)

Clicking a factory node in the dependency graph does nothing, even though nodes look interactive.

- Add a click handler to each D3 node that navigates to `/?factory={factoryId}` (or the appropriate route for focusing a factory in the planner)
- Change the node cursor to `pointer` on hover (`cursor: 'pointer'`)
- Add a visual hover state (e.g. brighten the node fill or add a highlight ring) to reinforce interactivity

---

### Fix 14 · Raw class names leak through in Recipe Database
**File:** `src/app/recipes/page.tsx` (or the API/data layer at `src/app/api/recipes/route.ts`)

Recipe cards display raw Unreal Engine class name strings for some products (e.g. `Desc_ResourceSinkShop_C`, `Desc_ResourceSink_C`) instead of human-readable names.

- In the Item/Recipe data models, ensure the `name` field is always populated with the display name
- If the `name` field is missing or equals the className, apply a fallback transform: strip the `Desc_` prefix and `_C` suffix, then convert PascalCase to Title Case (e.g. `Desc_ResourceSinkShop_C` → `Resource Sink Shop`)
- Apply this transform in the data import pipeline or as a display utility, not just in one component

---

## LOW PRIORITY / POLISH

### Fix 15 · Truncated factory names in sidebar have no tooltip
**File:** `src/components/Sidebar.tsx`

Long factory names are cut off with ellipsis (`...`) and there is no tooltip showing the full name.

- Add a native `title={factory.name}` attribute to the factory name element in the sidebar
- Or use a Radix UI `Tooltip` for a more styled experience

---

### Fix 16 · "Factory #1" ordinal metadata adds no user value
**File:** `src/components/Sidebar.tsx`

Each sidebar entry displays `Factory #1`, `Factory #2`, etc. as a secondary line — this is an internal ordering indicator with no value to the user.

- Replace the ordinal with more useful metadata. In order of preference:
  1. Location name (if assigned)
  2. Number of production lines (e.g. "3 lines")
  3. Nothing (remove it entirely)
- Only show location name if one is assigned; otherwise show production line count or nothing

---

### Fix 17 · Dependency tracker auto-refresh controls lack tooltips
**File:** `src/components/DependencyTracker.tsx`

The play/pause and refresh icon buttons in the dependency tracker banner are icon-only with no labels or tooltips.

- Add tooltips: "Refresh now", "Pause auto-refresh", "Resume auto-refresh"
- When auto-refresh is paused, change the banner subtitle text to say "Auto-refresh paused" instead of showing a countdown

---

### Fix 18 · "+ Create production line" and "Add Line" are redundant controls
**File:** `src/components/DependencyTracker.tsx`

In the expanded Missing Dependencies view, each ingredient shows both a clickable "+ Create production line" row and a separate "Add Line" button — two controls that appear to do the same thing.

- Keep only one: the "Add Line" button on the right is cleaner and more explicit
- Remove the "+ Create production line" clickable row, or make it clearly different (e.g. make it a non-clickable label)
- Ensure the remaining button has a clear label: "Add Production Line"

---

### Fix 19 · Graph canvas has no auto-fit on load
**File:** `src/components/FactoryDependencyGraph.tsx`

When the graph loads, unconnected factory nodes float far apart and the canvas is not centred on the content, making it feel empty.

- After the D3 force simulation stabilises (on `simulation.on("end", ...)`) call a fit/zoom-to-fit function that centres all nodes in the viewport with comfortable padding
- Add a "Fit to screen" button to the graph toolbar alongside the existing Zoom In/Out/Reset controls

---

### Fix 20 · Flow Editor dual-sidebar layout causes spatial confusion
**File:** `src/app/flow/page.tsx`

The Flow Editor shows both the app-wide factory sidebar on the left AND an items palette panel inside the canvas area, creating two competing side panels.

- Hide the global factory sidebar when on the `/flow` route (the flow editor has its own palette)
- Alternatively, combine the factory list and items palette into a single tabbed panel
- Add a clear heading or label to the items palette panel: "Drag onto canvas to add" with a visible divider between Items and Recipes tabs

---

## General Notes for All Fixes

- All components use **Tailwind CSS** and **shadcn/ui** (Radix UI primitives)
- Tooltips should use `@radix-ui/react-tooltip` — check `src/components/ui/` for an existing `tooltip.tsx` wrapper
- Number formatting should go into `src/lib/utils.ts` as a shared utility
- TypeScript strict mode is in use — ensure all new code is properly typed
- Test each fix by navigating to the affected page and exercising the scenario described
- Run `npm run lint` and `npm run build` after all changes to confirm there are no errors
