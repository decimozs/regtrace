import ImagePlaceholder from "./image-placeholder";

const steps = [
  {
    step: "01",
    title: "Initialize",
    code: "regtrace init",
    desc: "Scaffold a new project with a sample golden set and config file.",
  },
  {
    step: "02",
    title: "Add test cases",
    code: `# golden-sets/qa.yaml\n- id: qa-001\n  input: "What is ..."\n  expected_output: "..."`,
    desc: "Write YAML files with inputs and ideal responses. Golden sets are the ground truth contract.",
  },
  {
    step: "03",
    title: "Run evaluation",
    code: "regtrace run",
    desc: "Evaluates every test case. Format checks run deterministically — no API key needed.",
  },
  {
    step: "04",
    title: "Enforce in CI",
    code: "regtrace run --ci",
    desc: "Exit codes and JSON output map directly to pipeline pass/fail. Catch regressions before shipping.",
  },
];

export default function HowItWorksSection() {
  return (
    <div className="flex flex-col justify-center w-full h-full max-w-5xl mx-auto gap-10 px-4">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
        <p className="text-muted text-base max-w-xl mx-auto">
          A CLI tool that works in any language, any framework. No SDK, no
          platform, no vendor lock-in.
        </p>
      </div>

      <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {steps.map((s) => (
          <div key={s.step} className="flex items-start gap-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-card-bg border border-border flex items-center justify-center text-xs font-mono text-muted">
              {s.step}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="text-base font-semibold">{s.title}</h3>
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

      <ImagePlaceholder
        label="Terminal animation"
        className="max-w-lg mx-auto w-full"
      />
    </div>
  );
}
