# Monthly Bundle Catalogs

Each month has its own bundle catalog with separate files for GASO and FNB segments.

## Structure

```
bundles/
├── january/
│   ├── gaso.ts     # GASO bundles for January
│   └── fnb.ts      # FNB bundles for January
├── february/
│   ├── gaso.ts     # GASO bundles for February
│   └── fnb.ts      # FNB bundles for February
└── [future months]/
```

## How It Works

- The seeding script automatically loads bundles based on the active `period_id`
- Period format: `YYYYMM` (e.g., `202601` = January 2026)
- Bundles are loaded from `bundles/{month}/gaso.ts` and `bundles/{month}/fnb.ts`

## Adding a New Month

1. Create a folder: `bundles/{month}/` (e.g., `march`)
2. Create two files:
   - `gaso.ts` - Export `BUNDLES_SEED` array
   - `fnb.ts` - Export `FNB_BUNDLES_SEED` array
3. Copy structure from existing months and customize bundles

## File Format

Both `gaso.ts` and `fnb.ts` should export:

```typescript
export const BUNDLES_SEED: BundleSeed[] = [
  {
    image_id: "unique_id",
    name: "Bundle Name",
    price: 1799,
    primary_category: "celulares",
    categories: ["celulares", "cocinas"],
    composition: { fixed: [...], choices: [...] },
    installments: { "3m": 643.3, "6m": 339.58, ... },
  },
  // ... more bundles
];
```

## Tips

- **January**: Back-to-school bundles (laptops + accessories)
- **February**: Valentine's/romantic bundles (home entertainment)
- **March-April**: Fall comfort (heating appliances)
- **May**: Mother's Day kitchen bundles
- **June**: Father's Day tech bundles
- **July-August**: Fiestas Patrias full setups
- **December**: Summer + Christmas entertainment

Keep core products year-round, rotate promotional/seasonal combinations.
