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
	@sed -i 's/claim_extraction_depth: shallow/claim_extraction_depth: deep/' regtrace.config.yaml
	@sed -i 's/json_validity: true/json_validity: false/' regtrace.config.yaml
	@sed -i 's/json_schema: true/json_schema: false/' regtrace.config.yaml
	@sed -i 's/markdown_structure: true/markdown_structure: false/' regtrace.config.yaml
	@echo '' >> regtrace.config.yaml
	@echo 'storage:' >> regtrace.config.yaml
	@echo '  db:' >> regtrace.config.yaml
	@echo '    enabled: true' >> regtrace.config.yaml
	@echo '    path: .regtrace/sandbox.db' >> regtrace.config.yaml

init-claude: init seed env ## Scaffold project with Claude 3.5 Sonnet judge
	@echo "✓ Initialized with Anthropic Claude judge"
	@echo "  Set ANTHROPIC_API_KEY in .env for LLM-judged scores."

init-openai: init seed env ## Scaffold project with OpenAI GPT-4o judge
	@sed -i 's/provider: anthropic/provider: openai/' regtrace.config.yaml
	@sed -i 's/model: claude-3-5-sonnet-20240620/model: gpt-4o/' regtrace.config.yaml
	@echo "✓ Initialized with OpenAI GPT-4o judge"
	@echo "  Set OPENAI_API_KEY in .env for LLM-judged scores."

init-groq: init seed env ## Scaffold project with Groq Llama 3.3 judge
	@sed -i 's/provider: anthropic/provider: groq/' regtrace.config.yaml
	@sed -i 's/model: claude-3-5-sonnet-20240620/model: llama-3.3-70b-versatile/' regtrace.config.yaml
	@echo "✓ Initialized with Groq Llama 3.3 judge"
	@echo "  Set GROQ_API_KEY in .env for LLM-judged scores."

init-ollama: init seed env ## Scaffold project with Ollama local judge
	@sed -i 's/provider: anthropic/provider: ollama/' regtrace.config.yaml
	@sed -i 's/model: claude-3-5-sonnet-20240620/model: llama3.2/' regtrace.config.yaml
	@echo "✓ Initialized with Ollama Llama 3.2 judge"
	@echo "  Make sure Ollama is running locally (http://localhost:11434)."

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

db-stats: ## Show run count and stats from the SQLite database
	@bun -e "const {Database} = require('bun:sqlite'); const db = new Database('.regtrace/sandbox.db'); const cnt = db.prepare('SELECT COUNT(*) as c FROM runs').get(); console.log('Runs in database: ' + (cnt ? cnt.c : 0)); const latest = db.prepare('SELECT run_id, suite_score, golden_set_name, timestamp FROM runs ORDER BY timestamp DESC LIMIT 1').get(); if (latest) console.log('Latest run: ' + latest.run_id + ' (' + (latest.suite_score * 100).toFixed(1) + '%)'); db.close();" 2>/dev/null || echo "No database found. Run 'make run' first."

clean: ## Remove all run history and cached data
	rm -rf .regtrace

reset: clean ## Remove everything and re-init with seed data
	rm -f regtrace.config.yaml
	rm -rf golden-sets
	rm -f .env
	$(MAKE) init
	$(MAKE) seed

seed: ## Fill golden set with sample outputs so `make run` works immediately
	@sed -i '0,/actual_output: null/{s/actual_output: null/actual_output: "The capital of France is Paris."/}' golden-sets/qa.yaml
	@sed -i '0,/actual_output: null/{s/actual_output: null/actual_output: "Paris has a population of approximately 2.1 million people within the city limits."/}' golden-sets/qa.yaml
	@echo "✓ Golden set seeded with sample outputs"

env: ## Create .env template with API key placeholders (does not overwrite existing)
	@if [ ! -f .env ]; then \
		echo '# Regtrace API keys — uncomment the one matching your judge provider' > .env; \
		echo '#' >> .env; \
		echo '# ANTHROPIC_API_KEY=sk-ant-...' >> .env; \
		echo '# OPENAI_API_KEY=sk-...' >> .env; \
		echo '# GROQ_API_KEY=gsk_...' >> .env; \
		echo '# GEMINI_API_KEY=...' >> .env; \
		echo '✓ Created .env template — edit it with your API key'; \
	else \
		echo 'i .env already exists, keeping your existing keys.'; \
	fi
