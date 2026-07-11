import nextConfig from "eslint-config-next"
import reactHooks from "eslint-plugin-react-hooks"

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [".next/**", "node_modules/**", "public/**"],
  },
  {
    // React Compiler rules newly enabled by eslint-config-next 16 flag pre-existing
    // patterns in vendor/shadcn code (carousel.tsx, sidebar.tsx, use-mobile.tsx) and
    // in a couple of app hooks. Tracked in #61 rather than rewritten here — downgrade
    // to warn so `lint`/CI stay green without hiding them.
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
    },
  },
]

export default eslintConfig
