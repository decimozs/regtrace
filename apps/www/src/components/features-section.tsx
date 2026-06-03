import ImagePlaceholder from "./image-placeholder";

const pillars = [
  {
    title: "Factuality",
    description:
      "Are claims accurate and faithful to expected output? Detects hallucinations and unsupported assertions in RAG responses.",
    color: "border-l-accent",
  },
  {
    title: "Format",
    description:
      "Does output conform to required structure? Validates JSON schema, markdown structure, code blocks, and forbidden patterns.",
    color: "border-l-blue-500",
  },
  {
    title: "Tone",
    description:
      "Does output match expected voice and register? Evaluates formality, sentiment, assertiveness, and persona consistency.",
    color: "border-l-emerald-500",
  },
  {
    title: "Regression",
    description:
      "Is quality trending down from the last baseline? Automatically detects score drops, with version-aware comparison.",
    color: "border-l-amber-500",
  },
];

export default function FeaturesSection() {
  return (
    <div className="flex flex-col justify-center w-full h-full max-w-5xl mx-auto gap-10 px-4">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold">
          Four dimensions of quality
        </h2>
        <p className="text-muted text-base max-w-xl mx-auto">
          Every evaluation scores across four pillars. You get a clear answer to
          why a response failed, not just a number.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className={`rounded-lg border border-border bg-card-bg p-6 border-l-4 ${pillar.color} transition-all hover:border-foreground/30`}
          >
            <h3 className="text-lg font-semibold mb-2">{pillar.title}</h3>
            <p className="text-sm text-muted leading-relaxed">
              {pillar.description}
            </p>
            <ImagePlaceholder
              label={`${pillar.title} metric`}
              className="mt-4"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
