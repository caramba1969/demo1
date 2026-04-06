/**
 * Converts raw Satisfactory game data exports (en-GB.json / Docs.json style)
 * into the intermediate { items, recipes } format consumed by importSatisfactoryData.ts.
 *
 * The raw file is UTF-16 encoded and structured as:
 *   [ { NativeClass: "...", Classes: [ { ClassName, mDisplayName, ... } ] }, ... ]
 *
 * The output format is:
 *   {
 *     items:   { [className]: { name, slug, description, ... } },
 *     recipes: { [className]: { name, slug, ingredients, products, ... } }
 *   }
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConvertedItem {
  className: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sinkPoints: number;
  stackSize: number;
  energyValue: number;
  radioactiveDecay: number;
  liquid: boolean;
  fluidColor: { r: number; g: number; b: number; a: number };
}

export interface ConvertedIngredient {
  item: string;   // className
  amount: number;
}

export interface ConvertedRecipe {
  className: string;
  slug: string;
  name: string;
  alternate: boolean;
  time: number;
  inHand: boolean;
  forBuilding: boolean;
  inWorkshop: boolean;
  inMachine: boolean;
  manualTimeMultiplier: number;
  ingredients: ConvertedIngredient[];
  products: ConvertedIngredient[];
  producedIn: string[];
  isVariablePower: boolean;
  minPower: number;
  maxPower: number;
}

export interface ConvertedData {
  items: Record<string, ConvertedItem>;
  recipes: Record<string, ConvertedRecipe>;
}

// ---------------------------------------------------------------------------
// NativeClass filters
// ---------------------------------------------------------------------------

const ITEM_NATIVE_CLASSES = [
  'FGItemDescriptor',
  'FGResourceDescriptor',
  'FGItemDescriptorBiomass',
  'FGItemDescriptorNuclearFuel',
  'FGItemDescriptorPowerBoosterFuel',
  'FGConsumableDescriptor',
  'FGPowerShardDescriptor',
  'FGAmmoTypeProjectile',
  'FGAmmoTypeSpreadshot',
  'FGAmmoTypeInstantHit',
];

const RECIPE_NATIVE_CLASS = 'FGRecipe';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(className: string): string {
  // Strip common prefixes/suffixes then convert PascalCase to kebab-case
  let name = className
    .replace(/^Desc_/, '')
    .replace(/^Recipe_/, '')
    .replace(/_C$/, '');

  // PascalCase → kebab-case
  return name
    .replace(/([A-Z])/g, (m, l, i) => (i > 0 ? '-' : '') + l.toLowerCase())
    .replace(/[-_]+/g, '-')
    .replace(/^-/, '')
    .toLowerCase();
}

const STACK_SIZE_MAP: Record<string, number> = {
  SS_ONE: 1,
  SS_SMALL: 50,
  SS_MEDIUM: 100,
  SS_BIG: 200,
  SS_HUGE: 500,
  SS_FLUID: 0,
};

function parseStackSize(raw: string): number {
  return STACK_SIZE_MAP[raw] ?? 100;
}

/**
 * Parses a color string like "(B=255,G=128,R=64,A=255)" into { r, g, b, a }.
 */
function parseColor(raw: string): { r: number; g: number; b: number; a: number } {
  const get = (key: string) => {
    const m = raw.match(new RegExp(`${key}=(\\d+)`));
    return m ? parseInt(m[1], 10) : 255;
  };
  return { r: get('R'), g: get('G'), b: get('B'), a: get('A') };
}

/**
 * Extracts a className from a game path string such as:
 *   "/Script/Engine.BlueprintGeneratedClass'/Game/.../Desc_IronIngot.Desc_IronIngot_C'"
 * Returns just the ClassName portion, e.g. "Desc_IronIngot_C".
 */
function extractClassName(path: string): string {
  // Match the last segment after the final dot (before optional trailing quote)
  const m = path.match(/\.([A-Za-z0-9_]+)['""]?\s*$/);
  return m ? m[1] : path.trim().replace(/^['"]|['"]$/g, '');
}

/**
 * Parses Satisfactory's UE tuple-of-tuples ingredient/product string:
 *   ((ItemClass="...Desc_IronIngot_C'",Amount=3),(ItemClass="...Amount=2))
 */
function parseItemAmounts(raw: string): ConvertedIngredient[] {
  if (!raw || raw === '()') return [];
  const results: ConvertedIngredient[] = [];

  // Match each (ItemClass="...",Amount=N) block
  const tupleRe = /\(ItemClass=[^,)]+,Amount=(\d+)\)/g;
  const classRe = /ItemClass=(?:"[^"]*'([^']+)'[^"]*"|'([^']+)'|"([^"]+)")/;

  let m: RegExpExecArray | null;
  while ((m = tupleRe.exec(raw)) !== null) {
    const block = m[0];
    const amount = parseInt(m[1], 10);
    const cm = block.match(classRe);
    const rawPath = cm ? (cm[1] || cm[2] || cm[3]) : '';
    const className = extractClassName(rawPath);
    if (className) results.push({ item: className, amount });
  }

  return results;
}

/**
 * Parses the mProducedIn list:
 *   ("/Game/.../Build_ConstructorMk1.Build_ConstructorMk1_C","...")
 */
function parseProducedIn(raw: string): string[] {
  if (!raw || raw === '()') return [];
  const classNames: string[] = [];
  const pathRe = /"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = pathRe.exec(raw)) !== null) {
    classNames.push(extractClassName(m[1]));
  }
  return classNames.filter(Boolean);
}

// Buildings that indicate workshop / hand crafting
const WORKSHOP_KEYWORDS = ['WorkBench', 'WorkshopComponent', 'AutomatedWorkBench'];
const HAND_KEYWORDS = ['BuildGunBuild', 'Equipment', 'HandCraft'];
const BUILDING_KEYWORDS = ['Build_', 'FGBuildable'];

// ---------------------------------------------------------------------------
// Main converter
// ---------------------------------------------------------------------------

export function convertRawSatisfactoryData(rawJson: string): ConvertedData {
  const data: Array<{ NativeClass: string; Classes: Record<string, string>[] }> = JSON.parse(rawJson);

  const items: Record<string, ConvertedItem> = {};
  const recipes: Record<string, ConvertedRecipe> = {};

  for (const group of data) {
    const nativeClass = group.NativeClass ?? '';

    // ---- Items ----
    if (ITEM_NATIVE_CLASSES.some((cls) => nativeClass.includes(cls))) {
      for (const cls of group.Classes) {
        const className = cls.ClassName;
        if (!className) continue;

        const form = cls.mForm ?? '';
        const liquid = form === 'RF_LIQUID' || form === 'RF_GAS';

        items[className] = {
          className,
          slug: toSlug(className),
          name: cls.mDisplayName ?? className,
          description: (cls.mDescription ?? '').replace(/\\r\\n|\\n/g, ' ').trim(),
          icon: cls.mSmallIcon ?? cls.mPersistentBigIcon ?? '',
          sinkPoints: parseInt(cls.mResourceSinkPoints ?? '0', 10) || 0,
          stackSize: parseStackSize(cls.mStackSize ?? 'SS_MEDIUM'),
          energyValue: parseFloat(cls.mEnergyValue ?? '0') || 0,
          radioactiveDecay: parseFloat(cls.mRadioactiveDecay ?? '0') || 0,
          liquid,
          fluidColor: parseColor(cls.mFluidColor ?? '(B=255,G=255,R=255,A=0)'),
        };
      }
    }

    // ---- Recipes ----
    else if (nativeClass.includes(RECIPE_NATIVE_CLASS) && !nativeClass.includes('Customization')) {
      for (const cls of group.Classes) {
        const className = cls.ClassName;
        if (!className) continue;

        const displayName = cls.mDisplayName ?? className;
        const alternate = displayName.toLowerCase().startsWith('alternate:');
        const producedIn = parseProducedIn(cls.mProducedIn ?? '');

        const inWorkshop = producedIn.some((p) => WORKSHOP_KEYWORDS.some((kw) => p.includes(kw)));
        const forBuilding = producedIn.some((p) => HAND_KEYWORDS.some((kw) => p.includes(kw)));
        const inMachine = producedIn.some((p) =>
          BUILDING_KEYWORDS.some((kw) => p.includes(kw)) &&
          !WORKSHOP_KEYWORDS.some((kw) => p.includes(kw))
        );
        const inHand = !inWorkshop && !inMachine && !forBuilding && producedIn.length === 0;

        const varConstant = parseFloat(cls.mVariablePowerConsumptionConstant ?? '0');
        const varFactor = parseFloat(cls.mVariablePowerConsumptionFactor ?? '1');
        const isVariablePower = varConstant > 0 || varFactor !== 1;

        recipes[className] = {
          className,
          slug: toSlug(className),
          name: displayName,
          alternate,
          time: parseFloat(cls.mManufactoringDuration ?? '1') || 1,
          inHand,
          forBuilding,
          inWorkshop,
          inMachine,
          manualTimeMultiplier: parseFloat(cls.mManualManufacturingMultiplier ?? '1') || 1,
          ingredients: parseItemAmounts(cls.mIngredients ?? ''),
          products: parseItemAmounts(cls.mProduct ?? ''),
          producedIn,
          isVariablePower,
          minPower: varConstant,
          maxPower: varFactor,
        };
      }
    }
  }

  return { items, recipes };
}

/**
 * Reads a raw Satisfactory data file from disk (handles UTF-16 BOM automatically)
 * and returns the converted { items, recipes } structure.
 */
export function convertRawSatisfactoryFile(filePath: string): ConvertedData {
  const fs = require('fs') as typeof import('fs');
  const raw = fs.readFileSync(filePath);

  // Detect encoding: UTF-16 LE starts with BOM FF FE
  let text: string;
  if (raw[0] === 0xff && raw[1] === 0xfe) {
    text = raw.toString('utf16le');
    // Strip BOM if still present
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  } else if (raw[0] === 0xfe && raw[1] === 0xff) {
    // UTF-16 BE (unlikely but handle it)
    text = raw.swap16().toString('utf16le');
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  } else {
    text = raw.toString('utf8');
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  }

  return convertRawSatisfactoryData(text);
}
