.PHONY: up down migrate migration revert db-reset seed

up:
	docker compose up -d

down:
	docker compose down

migrate:
	pnpm --filter api run migration:run

migration:
	pnpm --filter api run migration:create -- src/migrations/$(NAME)

revert:
	pnpm --filter api run migration:revert

db-reset:
	docker compose down -v
	docker compose up -d postgres
	sleep 2
	$(MAKE) migrate

seed:
	pnpm --filter api run seed
