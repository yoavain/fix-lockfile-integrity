/**
 * Adds the node shebang to every bin file declared in package.json.
 *
 * This replaces the "add-shebang" package. That package depends on "prepend-file",
 * which depends on a vulnerable version of "tmp".
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SHEBANG = "#!/usr/bin/env node\n";
const PACKAGE_JSON = "package.json";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Collects the bin files of a package.json.
 * The "bin" field is a string, an array, or an object. Two names can point to one file,
 * therefore the result is de-duplicated.
 *
 * @param bin   the "bin" field of package.json
 * @returns     a list of unique file paths, relative to the package root
 */
const getBinFiles = (bin) => {
    if (!bin) {
        return [];
    }
    const files = typeof bin === "string" ? [bin] : Array.isArray(bin) ? bin : Object.values(bin);
    return [...new Set(files.filter((file) => typeof file === "string" && file.length > 0))];
};

/**
 * Adds the shebang to one file. A file that already starts with a shebang stays unchanged.
 *
 * @param file  file path, relative to the package root
 */
const addShebang = async (file) => {
    const filePath = path.resolve(rootDir, file);
    const content = await fs.readFile(filePath, "utf8");
    if (content.startsWith("#!")) {
        console.log(`Shebang already present: ${file}`);
        return;
    }
    await fs.writeFile(filePath, SHEBANG + content);
    console.log(`Added shebang: ${file}`);
};

const main = async () => {
    const packageJson = JSON.parse(await fs.readFile(path.resolve(rootDir, PACKAGE_JSON), "utf8"));
    const files = getBinFiles(packageJson.bin);
    if (files.length === 0) {
        console.log(`No bin files declared in ${PACKAGE_JSON}`);
        return;
    }
    for (const file of files) {
        await addShebang(file);
    }
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
