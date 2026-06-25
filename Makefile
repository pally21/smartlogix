.PHONY: test-e2e test-e2e-shell test-e2e-all

test-e2e:
	@echo "Running orders-service Jest E2E..."
	@npm --prefix orders-service run test:e2e

test-e2e-shell:
	@echo "Running scripts/e2e/test_order_e2e.sh..."
	@chmod +x scripts/e2e/test_order_e2e.sh && scripts/e2e/test_order_e2e.sh

test-e2e-all: test-e2e test-e2e-shell
