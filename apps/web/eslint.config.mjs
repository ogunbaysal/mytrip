import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Get the configs from compat
const nextConfigs = compat.extends("next/core-web-vitals", "next/typescript");

// Deep filter to remove all 'name' properties from any nested object
function deepFilterName(obj, visited = new WeakSet()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Prevent circular reference issues
  if (visited.has(obj)) {
    return obj;
  }
  visited.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => deepFilterName(item, visited));
  }

  const result = {};
  for (const key of Object.keys(obj)) {
    // Skip 'name' properties at any level
    if (key === 'name') {
      continue;
    }

    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      result[key] = deepFilterName(value, visited);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const eslintConfig = [
  ...nextConfigs.map(config => deepFilterName(config)),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
