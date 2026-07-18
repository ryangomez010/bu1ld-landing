.PHONY: setup lint typecheck test security smoke build run audit release-check

setup:
	bun install --frozen-lockfile

lint:
	bun run lint

typecheck:
	bun run typecheck

test:
	bun run test

security:
	bun run audit:ci

smoke:
	bun run smoke

build:
	bun run build

run:
	bun run dev

audit: lint typecheck test security smoke

release-check:
	bun run release:check
