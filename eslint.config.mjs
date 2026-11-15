import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Bundled agent skill tooling (CommonJS scripts, not app code):
    ".agents/**",
    // Session scratch space and QA screenshots:
    ".qwen/**",
    "shots/**",
    // Verbatim copies of the shared component library in work/utils/components.
    // Vendored as-is, so they are not reformat-linted here.
    "components/ui/library/**",
  ]),
]);

export default eslintConfig;
