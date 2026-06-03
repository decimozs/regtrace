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

init-claude: init seed ## Scaffold project with Anthropic Claude judge (default)
	@echo "✓ Initialized with Anthropic Claude judge"

init-openai: init seed ## Scaffold project with OpenAI GPT-4o judge
	@sed -i 's/provider: anthropic/provider: openai/' regtrace.config.yaml
	@sed -i 's/model: claude-3-5-sonnet-20240620/model: gpt-4o/' regtrace.config.yaml
	@echo "✓ Initialized with OpenAI GPT-4o judge"

init-groq: init seed ## Scaffold project with Groq Llama 3.1 judge
	@sed -i 's/provider: anthropic/provider: groq/' regtrace.config.yaml
	@sed -i 's/model: claude-3-5-sonnet-20240620/model: llama-3.1-70b-versatile/' regtrace.config.yaml
	@echo "✓ Initialized with Groq Llama 3.1 judge"

init-ollama: init seed ## Scaffold project with Ollama local judge
	@sed -i 's/provider: anthropic/provider: ollama/' regtrace.config.yaml
	@sed -i 's/model: claude-3-5-sonnet-20240620/model: llama3.2/' regtrace.config.yaml
	@echo "✓ Initialized with Ollama Llama 3.2 judge"

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

reset: clean ## Remove everything and re-init with seed data
	rm -f regtrace.config.yaml
	rm -rf golden-sets
	$(MAKE) init
	$(MAKE) seed

seed: ## Fill golden set with sample outputs so `make run` works immediately
	@sed -i '0,/actual_output: null/{s/actual_output: null/actual_output: "The capital of France is Paris."/}' golden-sets/qa.yaml
	@sed -i '0,/actual_output: null/{s/actual_output: null/actual_output: "Paris has a population of approximately 2.1 million people within the city limits."/}' golden-sets/qa.yaml
	@echo "✓ Golden set seeded with sample outputs"
