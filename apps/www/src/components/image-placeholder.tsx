interface ImagePlaceholderProps {
  label: string;
  className?: string;
}

export default function ImagePlaceholder({
  label,
  className = "",
}: ImagePlaceholderProps) {
  return (
    <div
      className={`rounded-lg border border-dashed border-border bg-card-bg flex items-center justify-center h-40 text-sm text-muted ${className}`}
      role="img"
      aria-label={`Placeholder for ${label}`}
    >
      <div className="text-center space-y-1">
        <svg
          className="mx-auto h-6 w-6 text-muted/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
          role="img"
          aria-label="Image placeholder icon"
        >
          <title>Image placeholder icon</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
          />
        </svg>
        <p className="text-xs">{label}</p>
      </div>
    </div>
  );
}
