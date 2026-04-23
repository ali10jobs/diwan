import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Block physical-direction Tailwind utilities. RTL parity is a hard merge gate
// (see CLAUDE.md → "Non-Negotiable Conventions"); use logical properties
// (ps-/pe-/ms-/me-/start-/end-) instead.
const physicalDirectionPattern =
  "/(?:^|\\s)(?:-?(?:pl|pr|ml|mr|left|right)-[\\w/.\\[\\]-]+|-?(?:border|rounded)-(?:l|r|tl|tr|bl|br)(?:-[\\w/.\\[\\]-]+)?|text-(?:left|right))(?:\\s|$)/";

const logicalPropertiesRule = [
  {
    selector: `Literal[value=${physicalDirectionPattern}]`,
    message:
      "Use Tailwind logical-direction utilities (ps-/pe-/ms-/me-/start-/end-) instead of physical ones. RTL parity is a merge gate.",
  },
  {
    selector: `TemplateElement[value.raw=${physicalDirectionPattern}]`,
    message:
      "Use Tailwind logical-direction utilities (ps-/pe-/ms-/me-/start-/end-) instead of physical ones. RTL parity is a merge gate.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": ["error", ...logicalPropertiesRule],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "tokens/build/**",
  ]),
]);

export default eslintConfig;
