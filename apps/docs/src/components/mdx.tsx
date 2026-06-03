import * as AccordionComponents from "fumadocs-ui/components/accordion";
import * as StepsComponents from "fumadocs-ui/components/steps";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Mermaid } from "./mdx/mermaid";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    ...AccordionComponents,
    ...StepsComponents,
    TypeTable,
    Mermaid,
    ...(components as MDXComponents | undefined),
  } satisfies MDXComponents;
}
