import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,jsx}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    env: {
      browser: true,
      es2020: true, // Υποστήριξη για ES2020 (περιλαμβάνει BigInt)
      node: true,
    },
    parserOptions: {
      ecmaVersion: 2020, // Χρήση ECMAScript 2020
      sourceType: "module",
    },
    globals: {
      BigInt: "readonly", // Δημιουργία του BigInt ως global
    },
  },
];