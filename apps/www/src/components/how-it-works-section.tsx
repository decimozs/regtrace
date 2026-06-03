const steps = [
  {
    title: "Initialize",
    code: "regtrace init",
    desc: "Scaffold a new project with a sample golden set and config file.",
  },
  {
    title: "Add test cases",
    code: `id: qa-001\ninput: "What is the refund policy?"\nexpected_output: "Returns within 30 days..."`,
    desc: "Write YAML files with inputs and ideal responses. Golden sets are the ground truth contract.",
  },
  {
    title: "Run evaluation",
    code: "regtrace run",
    desc: "Evaluates every test case. Format checks run deterministically — no API key needed.",
  },
  {
    title: "Enforce in CI",
    code: "regtrace run --ci",
    desc: "Exit codes and JSON output map directly to pipeline pass/fail. Catch regressions before shipping.",
  },
];

export default function HowItWorksSection() {
  return (
    <div className="flex flex-col justify-center w-full h-full max-w-4xl mx-auto gap-10 px-4">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
          How it works
        </h2>
        <p className="text-muted text-base max-w-xl mx-auto leading-relaxed">
          A CLI tool that works in any language, any framework. No SDK, no
          platform, no vendor lock-in.
        </p>
      </div>

      <div className="relative max-w-2xl mx-auto w-full">
        {/* Vertical connecting line */}
        <div className="absolute left-3.5 top-3 bottom-3 w-px bg-border" />

        <div className="flex flex-col gap-8">
          {steps.map((s) => (
            <div key={s.title} className="relative flex items-start gap-5 pl-0">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0 w-7 h-7 rounded-full border-2 border-accent bg-background flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-accent" />
              </div>

              <div className="flex-1 min-w-0 space-y-2 pt-1">
                <h3 className="text-base font-semibold tracking-tight">
                  {s.title}
                </h3>
                <div className="rounded-md bg-code-bg border border-border p-3 overflow-x-auto">
                  <pre className="text-xs text-muted font-mono leading-relaxed whitespace-pre-wrap break-all">
                    {s.code}
                  </pre>
                </div>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
