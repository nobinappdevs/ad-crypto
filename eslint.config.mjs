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
    // A second Next app kept in-tree for reference. Its `@/` imports resolve
    // against ITS own src, so linting or type-checking it from here reports
    // hundreds of phantom unresolved modules. Excluded in tsconfig.json too.
    "demo/**",
  ]),
]);

export default eslintConfig;
