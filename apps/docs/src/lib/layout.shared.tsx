import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";
import { appName, gitConfig } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: (
        <div className="flex items-center gap-2">
          <Image
            src="/apple-touch-icon.png"
            width={20}
            height={20}
            alt="Regtrace"
          />
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
