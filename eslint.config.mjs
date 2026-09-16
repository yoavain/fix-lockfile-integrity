import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { createNodeResolver, importX } from "eslint-plugin-import-x";
import jest from "eslint-plugin-jest";
import n from "eslint-plugin-n";
import security from "eslint-plugin-security";
import globals from "globals";

// region file globs

// ------------------------------------------------------------------------------------------
// File globs by type
// ------------------------------------------------------------------------------------------
const JS_FILES = ["**/*.js", "**/*.cjs", "**/*.mjs"];
const TS_FILES = ["**/*.ts"];
const TEST_FILES = ["test/**/*", "integration_test/**/*"];

// endregion file globs

// region rules

// ------------------------------------------------------------------------------------------
// Shared base configuration
// ------------------------------------------------------------------------------------------
const BASE_LANGUAGE_OPTIONS = {
    ecmaVersion: 2022,
    sourceType: "module"
};

const BASE_GLOBALS = {
    ...globals.node,
    ...globals.jest,
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
};

const SHARED_PLUGINS = {
    "import-x": importX,
    n,
    security
};

const SHARED_SETTINGS = {
    "import-x/resolver-next": [
        createTypeScriptImportResolver({ alwaysTryTypes: true }),
        createNodeResolver()
    ]
};

// ------------------------------------------------------------------------------------------
// Style rules
// ------------------------------------------------------------------------------------------
const STYLE_RULES = {
    "max-len": ["error", { code: 200 }],
    "indent": ["error", 4, { SwitchCase: 1 }],
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "brace-style": ["error", "stroustrup"],
    "object-curly-spacing": ["error", "always"],
    "no-mixed-spaces-and-tabs": "error",
    "arrow-parens": "error",
    "arrow-spacing": "error",
    "comma-dangle": ["error", "never"],
    "comma-style": "error",
    "no-extra-semi": "error",
    "comma-spacing": "error",
    "space-in-parens": ["error", "never"],
    "space-before-blocks": "error",
    "space-before-function-paren": ["error", { anonymous: "never", named: "never", asyncArrow: "always" }],
    "keyword-spacing": "error",
    "quote-props": ["error", "consistent-as-needed", { numbers: true }],
    "one-var": ["error", "never"]
};

// ------------------------------------------------------------------------------------------
// Base JS quality and ecosystem rules
// ------------------------------------------------------------------------------------------
const JS_RULES = {
    ...js.configs.recommended.rules,
    ...n.configs["flat/recommended"].rules,
    ...security.configs.recommended.rules,

    "max-params": ["warn", 4],
    "max-depth": ["error", 3],
    "max-statements-per-line": ["error", { max: 1 }],
    "max-lines": ["error", { max: 1000, skipBlankLines: true, skipComments: true }],
    "max-lines-per-function": ["warn", { max: 75, skipBlankLines: true, skipComments: true }],
    "no-unused-vars": "warn",
    "no-useless-escape": "error",
    "no-empty-pattern": "error",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-prototype-builtins": "error",
    "prefer-const": "off",
    "no-process-exit": "off",

    // Import plugin
    "import-x/extensions": [
        "error",
        {
            ts: "never",
            js: "never",
            json: "always"
        }
    ],
    "import-x/named": "warn",
    "import-x/no-duplicates": "error",
    "import-x/no-unresolved": "off",
    "import-x/default": "off",

    // Node plugin
    "n/no-sync": "off",
    "n/exports-style": ["error", "module.exports"],
    "n/no-process-exit": "off",
    "n/no-unpublished-require": "off",
    "n/no-extraneous-import": "off",
    "n/no-deprecated-api": "warn",
    "n/no-missing-require": [
        "error",
        {
            tryExtensions: [".ts", ".js", ".d.ts", ".json", ".node"],
            allowModules: ["clean-webpack-plugin", "copy-webpack-plugin"]
        }
    ],
    "n/no-missing-import": "off",
    // fs.globSync exists from Node 22.0.0. It is marked stable from Node 22.17.0.
    // src/workspaces.ts uses the cwd option only, which did not change
    "n/no-unsupported-features/node-builtins": ["error", { ignores: ["fs.globSync"] }],
    "n/no-unpublished-import": "off",
    "n/no-unsupported-features/es-syntax": "off"
};

// ------------------------------------------------------------------------------------------
// TypeScript rules
// ------------------------------------------------------------------------------------------
const TS_RULES = {
    ...typescriptEslint.configs["eslint-recommended"].overrides[0].rules,
    ...typescriptEslint.configs.recommended.rules,
    // eslint-recommended re-enables prefer-const for TypeScript files
    "prefer-const": "off",
    "import-x/extensions": "off",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-use-before-define": "warn",
    "@typescript-eslint/no-var-requires": "warn",
    "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }] // Style
};

// endregion rules

// region config

// ------------------------------------------------------------------------------------------
// Ignore patterns for files and directories not to lint
// ------------------------------------------------------------------------------------------
export const IGNORE_CONFIG = {
    ignores: [
        "**/node_modules/",
        "**/dist/",
        "**/coverage/",
        "test/resources/**/*"
    ]
};

// ------------------------------------------------------------------------------------------
// JavaScript files config
// ------------------------------------------------------------------------------------------
export const JS_CONFIG = {
    files: JS_FILES,
    languageOptions: {
        ...BASE_LANGUAGE_OPTIONS,
        globals: BASE_GLOBALS
    },
    plugins: SHARED_PLUGINS,
    settings: SHARED_SETTINGS,
    rules: {
        ...STYLE_RULES,
        ...JS_RULES
    }
};

// ------------------------------------------------------------------------------------------
// TypeScript files config
// ------------------------------------------------------------------------------------------
export const TS_CONFIG = {
    files: TS_FILES,
    languageOptions: {
        ...BASE_LANGUAGE_OPTIONS,
        parser: tsParser,
        globals: {
            ...BASE_GLOBALS,
            NodeJS: "readonly"
        },
        parserOptions: {
            projectService: true
        }
    },
    plugins: {
        "@typescript-eslint": typescriptEslint,
        ...SHARED_PLUGINS
    },
    settings: SHARED_SETTINGS,
    rules: {
        ...STYLE_RULES,
        ...JS_RULES,
        ...TS_RULES
    }
};

// ------------------------------------------------------------------------------------------
// Test files config
// ------------------------------------------------------------------------------------------
export const TEST_CONFIG = {
    files: TEST_FILES,
    plugins: {
        jest
    },
    languageOptions: {
        globals: jest.environments.globals.globals
    },
    rules: {
        "no-global-assign": "off"
    }
};

// endregion config

export default [
    IGNORE_CONFIG,
    JS_CONFIG,
    TS_CONFIG,
    TEST_CONFIG
];
