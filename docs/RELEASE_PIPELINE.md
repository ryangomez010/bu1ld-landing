# Release Pipeline

## The Bu1ld

Local code gate:

```bash
bun run release:check
```

Production environment gate:

```bash
bun run release:prod
```

The production gate must run where deployment secrets and live database access exist. It includes type checking, tests, lint, build, schema verification, RLS verification, and production copy/security gates.

## Finance4All

Run from `/Users/ryan/Downloads/finance4all-global-reach-main`:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

## Genesis

Run from `/Users/ryan/Documents/Genesis`:

```bash
bash scripts/verify_release.sh
```

## GenesisE

Run from `/Users/ryan/Documents/GenesisE`:

```bash
PYTHONPATH=src python3 -m unittest discover -s tests -v
PYTHONPATH=src python3 -m genesis_econ --help
```

## Release decision rule

Do not release a project because another project passed. Each project needs its own successful gate in its own environment.
