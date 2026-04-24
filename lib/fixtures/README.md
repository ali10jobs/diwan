# Fixtures

All data in this folder is synthetic. No PII.

- **Names** are drawn from a closed dictionary of common KSA given + family names in `names.ts`. Pairs are combined randomly from the seeded PRNG stream — the resulting full names are not known individuals.
- **MSISDN** values are constructed as `+9665XXXXXXXX` with a deterministic 8-digit suffix seeded by the customer index. They are not assigned to any real subscriber.
- **Governorates, tiers, statuses, channels, types** follow CLAUDE.md's enums verbatim.
- **Amounts** are stored as integer halalas (`1 SAR = 100`). Never use floats for currency here.
- **Seed**: `DIWAN_SEED` env var. Default `20260423`. Fixtures are materialized once per warm function instance via `seed.ts`; Fluid Compute reuses that instance across concurrent requests, so a cold start regenerates the dataset deterministically.
