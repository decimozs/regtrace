import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, gitConfig } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: (
        <div className="flex items-center gap-2">
          <img src="/apple-touch-icon.png" className="size-5" alt="Regtrace" />
          {appName}
        </div>
      ),
    },
    links: [
      {
        text: "Documentation",
        url: "/docs",
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
