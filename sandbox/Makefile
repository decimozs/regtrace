BIN := ../regtrace
DIR := .

.DEFAULT_GOAL := help

help: ## Show available targets
	@echo "Regtrace Sandbox — available targets:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

init: ## Scaffold a new regtrace project
	$(BIN) init

run: ## Run evaluation on all enabled golden sets
	$(BIN) run

run-dry: ## Validate config without executing evaluations
	$(BIN) run --dry-run

run-verbose: ## Run with all test cases shown (including passing)
	$(BIN) run --verbose

run-json: ## Run with JSON output to stdout
	$(BIN) run --format json

run-ci: ## Run in CI mode — exit 1 on quality gate failure
	$(BIN) run --ci

run-markdown: ## Run and generate markdown report
	$(BIN) run --format markdown --output report.md

list: ## List recent run records
	$(BIN) list

history: ## Show details of the latest run
	$(BIN) history

baseline-show: ## Display current baseline
	$(BIN) baseline show

baseline-pin: ## Pin a specific run as baseline (usage: make baseline-pin RUN_ID=<id>)
	$(BIN) baseline pin $(RUN_ID)

baseline-unpin: ## Revert to last_passing baseline strategy
	$(BIN) baseline unpin

db-rebuild: ## Rebuild SQLite database from JSON run files
	$(BIN) db rebuild

clean: ## Remove all run history and cached data
	rm -rf .regtrace

reset: clean ## Remove everything and re-init
	rm -f regtrace.config.yaml
	rm -rf golden-sets
	$(MAKE) init
