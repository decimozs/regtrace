export default function FooterSection() {
  return (
    <div className="flex flex-col justify-center items-center w-full h-full gap-12 max-w-3xl mx-auto px-4">
      <div className="text-center space-y-2">
        <p className="text-xl font-bold tracking-tight">Regtrace</p>
        <p className="text-sm text-muted max-w-xs mx-auto">
          A linter for your LLM outputs. Open source, CLI-first,
          language-agnostic.
        </p>
      </div>

      <div className="flex items-center gap-8 text-sm text-muted">
        <a
          href="https://github.com/decimozs/regtrace"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          GitHub
        </a>
        <a href="/docs" className="hover:text-foreground transition-colors">
          Documentation
        </a>
        <a
          href="https://github.com/decimozs/regtrace/tree/main/examples"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Examples
        </a>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card-bg px-3 py-1 text-xs text-muted font-mono">
          CLI-First
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card-bg px-3 py-1 text-xs text-muted font-mono">
          Built with Bun
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card-bg px-3 py-1 text-xs text-muted font-mono">
          MIT License
        </span>
      </div>

      <p className="text-xs text-muted/60 text-center">
        &copy; {new Date().getFullYear()} Regtrace. Open source. No data leaves
        your machine.
      </p>
    </div>
  );
}
