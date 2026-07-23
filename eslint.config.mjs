import nextConfig from "eslint-config-next"
import * as espree from "espree"

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [".next/**", "node_modules/**", "public/**", "coverage/**"],
  },
  {
    // eslint-config-next sets settings.react.version: "detect", which under
    // ESLint 10 crashes inside eslint-plugin-react's version-detection code
    // path - it still calls the removed legacy `context.getFilename()` API
    // (jsx-eslint/eslint-plugin-react#3977, unresolved upstream). Pinning the
    // version explicitly skips that code path. Keep in sync with the `react`
    // dependency's major.minor; drop once eslint-plugin-react supports ESLint 10.
    settings: { react: { version: "19.2" } },
  },
  {
    // Config files are plain ESM (no JSX). eslint-config-next routes every
    // non-TS file through its bundled @babel/eslint-parser
    // (next/dist/compiled/babel/eslint-parser), which returns a
    // pre-ESLint-10 scope manager missing addGlobals() and crashes with
    // "scopeManager.addGlobals is not a function". That parser is webpack-
    // bundled inside the `next` package, so it can't be overridden via npm -
    // instead, parse these files with ESLint's own espree, which implements
    // the ESLint 10 scope-manager contract. Remove once Next.js re-bundles
    // @babel/eslint-parser >=8 (babel/babel#17791).
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      parser: espree,
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
]

export default eslintConfig
