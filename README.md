![](https://raw.githubusercontent.com/yoavain/fix-lockfile-integrity/main/resources/docs/logo.gif)
# Fix Lockfile Intgrity 
[![Actions Status](https://github.com/yoavain/fix-lockfile-integrity/workflows/Node%20CI/badge.svg)](https://github.com/yoavain/fix-lockfile-integrity/actions)
![node](https://img.shields.io/node/v/fix-lockfile-integrity.svg)
![types](https://img.shields.io/npm/types/typescript.svg)
![commit](https://img.shields.io/github/last-commit/yoavain/fix-lockfile-integrity.svg)
![license](https://img.shields.io/npm/l/fix-lockfile-integrity.svg)
[![fix-lockfile-integrity](https://snyk.io/advisor/npm-package/fix-lockfile-integrity/badge.svg)](https://snyk.io/advisor/npm-package/fix-lockfile-integrity)
[![Known Vulnerabilities](https://snyk.io/test/github/yoavain/fix-lockfile-integrity/badge.svg?targetFile=package.json)](https://snyk.io//test/github/yoavain/fix-lockfile-integrity?targetFile=package.json)
[![codecov](https://codecov.io/gh/yoavain/fix-lockfile-integrity/branch/main/graph/badge.svg)](https://codecov.io/gh/yoavain/fix-lockfile-integrity)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
![visitors](https://visitor-badge.glitch.me/badge?page_id=yoavain.fix-lockfile-integrity)
![Downloads](https://img.shields.io/npm/dm/fix-lockfile-integrity.svg)

**Fix sha1 integrity in lock files back to sha512**

## Features
- Reverts all sha1 back to sha512 which is more secure.
- Works with both package-lock.json and npm-shrinkwrap.json
- Works with lockfile version 1 & 2
- Can be configured to work on multiple paths to support monorepo 
- Works only on file system without touching your version control


## Limitations
- Fixes only with packages from npm registry [registry.npmjs.org](https://www.npmjs.com/)


## Installation

Install globally:

```sh
npm install -g fix-lockfile-integrity
```

Or run with [npx](https://docs.npmjs.com/cli/v8/commands/npx):

```sh
npx fix-lockfile-integrity
```

## Usage

Check local folder for a lockfile (package-lock.json or npm-shrinkwrap.json) and fix any sha1 in it

```sh
$ fix-lockfile
Overwriting lock file ./package-lock.json with 10 integrity fixes
```

> **Make sure your lock file is in version control and all changes have been committed. This _will_ overwrite your lock file.**

To fix a specific file not in the current folder:

```sh
$ fix-lockfile <file>
```

## CLI Options
```
fix-lockfile-integrity [file]

Fix lock file integrity

Positionals:
  file  file to fix (default: looks for package-lock.json/npm-shrinkwrap.json in running folder

Options:
      --version  Show version number                                   [boolean]
  -c, --config   configuration file                                     [string]
  -v, --verbose  verbose logging                                       [boolean]
  -q, --quiet    quiet (suppresses verbose too)                        [boolean]
  -h, --help     Show help                                             [boolean]

```

## Configuration file

Configuration file can be in several formats and are automatically loaded.  
Alternatively, you can specify configuration file to load via CLI `--config` (alias: `-c`) 

### TypeScript

`.fix-lockfile.ts` or ` fix-lockfile.config.ts`

```ts
import type { FixLockFileIntegrityConfig } from "fix-lockfile-integrity";

const config: FixLockFileIntegrityConfig = {
    includePaths: ["./", "./packages/a", "./packages/b"],
    lockFileNames: ["package-lock.json"],
    prettier: {
        useTabs: true,
        endOfLine: "cr"
    }
};

export default config;
```

### JavaScript

`.fix-lockfile.js` or ` fix-lockfile.config.js`

```js
const config = {
    includePaths: ["./", "./packages/a", "./packages/b"],
    lockFileNames: ["package-lock.json"],
    prettier: {
        useTabs: true,
        endOfLine: "cr"
    }
};

module.exports = config;
```

### JSON

`.fix-lockfile.json` or ` fix-lockfile.config.json`

```json
{
    "includePaths": ["./", "./packages/a", "./packages/b"],
    "lockFileNames": ["package-lock.json"],
    "prettier": {
        "useTabs": true,
        "endOfLine": "cr"
    }
}
```

### YAML

`.fix-lockfile.yaml`, ` fix-lockfile.config.yml`, `.fix-lockfile.yaml` or ` fix-lockfile.config.yml`

```yaml
includePaths:
    - "./"
    - "./packages/a"
    - "./packages/b"
lockFileNames:
    - package-lock.json
prettier:
    useTabs: true
    endOfLine: cr
```

### Configuration options
```
- includeFiles:     Explicit list of files to fix       (default: none)
- includePaths:     Paths to look for lock files in     (default: ".")
- lockFileNames:    Lock files to look for              (default: ["package-lock.json", "npm-shrinkwrap.json"])
- prettier:         Overriding prettier config in case needed
```

## Automation

If you want to make sure to avoid those `sha1` in your files and avoid unnecessary changes in PRs, you should do one of the following:

#### 1) Add to postinstall
This way it will run after each time you run `npm install`
```json
{
    "postinstall": "fix-lockfile package-lock.json"
}
```

#### 2) pre-commit hook
Using husky (or alike) to run as a pre-commit hook


## Why?

NPM has known issue of constantly changing integrity property of its lock file. Integrity may change due to plenty of reasons. Some of them are:

1. npm install done on machine with different OS from one where lock file generated
2. some package version updated
3. another version of npm used

Intention of this tool is to prevent such changes and make integrity property secure and reliable.


## Report issues

If something doesn't work, please [file an issue](https://github.com/yoavain/fix-lockfile-integrity/issues/new).
