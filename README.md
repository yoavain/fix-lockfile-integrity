![](https://raw.githubusercontent.com/yoavain/fix-lockfile-integrity/main/resources/docs/logo.gif)
# Create Windowless App
[![Total alerts](https://img.shields.io/lgtm/alerts/g/yoavain/fix-lockfile-integrity.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/yoavain/fix-lockfile-integrity/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/yoavain/fix-lockfile-integrity.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/yoavain/fix-lockfile-integrity/context:javascript)
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

Fix lockfile integrity

todo
 [ ] Support configuration, with multiple locations. Default __dirname
 [ ] Support prettier / keep indentation/white spaces, etc
 [ ] Support mutliple registies 



If something doesn't work, please [file an issue](https://github.com/yoavain/fix-lockfile-integrity/issues/new). 

## Quick Overview

```sh
npx fix-lockfile-integrity
```

<details><summary>Or with npm</summary>
<p>
You can install fix-lockfile-integrity globally:

```sh
npm install -g fix-lockfile-integrity
```

And then you can run:
```sh
fix-lockfile-integrity
```
</p>
</details>

## Why?

NPM has known issue of constantly changing integity property of its lock file. Integrity may change due to plenty of reasons. Some of them are:

1. npm install done on machine with different OS from one where lock file generated
2. some package version updated
3. another version of npm used

Intention of this tool is to prevent such changes and make integrity property secure and reliable.
