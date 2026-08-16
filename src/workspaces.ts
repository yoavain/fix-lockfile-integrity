import fs from "fs";
import path from "path";

const PACKAGE_JSON: string = "package.json";
const LERNA_JSON: string = "lerna.json";
const LERNA_DEFAULT_PACKAGES: Array<string> = ["packages/*"];
const EXCLUDE_PREFIX: string = "!";

type PackageJsonPartial = {
    workspaces?: Array<string> | { packages?: Array<string> }
};

type LernaJsonPartial = {
    packages?: Array<string>
};

const readJsonFile = <T>(filePath: string): T | undefined => {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
    }
    catch {
        return undefined;
    }
};

// globSync returns an empty array on a pattern it cannot parse
const expandPattern = (pattern: string, rootDir: string): Array<string> => fs.globSync(pattern, { cwd: rootDir });

const isUsablePattern = (pattern: unknown): pattern is string => typeof pattern === "string" && pattern.length > 0;

const toPosixPath = (relativePath: string): string => {
    const posixPath: string = relativePath.split(path.sep).join("/");
    return posixPath === "." ? "./" : `./${posixPath}`;
};

/**
 * Reads the workspace definition of a project.
 * npm/yarn workspaces come first, then lerna.json (legacy)
 *
 * @param rootDir   root folder of the project
 */
export const getWorkspacePatterns = (rootDir: string): Array<string> => {
    const packageJson = readJsonFile<PackageJsonPartial>(path.resolve(rootDir, PACKAGE_JSON));
    const workspaces = packageJson?.workspaces;
    if (Array.isArray(workspaces)) {
        return workspaces;
    }
    if (Array.isArray(workspaces?.packages)) {
        return workspaces.packages;
    }

    const lernaJson = readJsonFile<LernaJsonPartial>(path.resolve(rootDir, LERNA_JSON));
    if (!lernaJson) {
        return [];
    }
    return Array.isArray(lernaJson.packages) ? lernaJson.packages : LERNA_DEFAULT_PACKAGES;
};

/**
 * Finds the workspace folders of a project that hold a lock file.
 * A folder without a lock file fails the run, therefore it is filtered out
 *
 * @param rootDir           root folder of the project
 * @param lockFileNames     lock file names to look for
 */
export const getWorkspacePaths = (rootDir: string, lockFileNames: Array<string>): Array<string> => {
    const patterns: Array<string> = getWorkspacePatterns(rootDir).filter(isUsablePattern);
    const includePatterns: Array<string> = patterns.filter((pattern: string) => !pattern.startsWith(EXCLUDE_PREFIX));
    const excludePatterns: Array<string> = patterns.filter((pattern: string) => pattern.startsWith(EXCLUDE_PREFIX)).map((pattern: string) => pattern.slice(1));

    const excluded: Set<string> = new Set(excludePatterns.flatMap((pattern: string) => expandPattern(pattern, rootDir)));
    const matches: Set<string> = new Set(includePatterns.flatMap((pattern: string) => expandPattern(pattern, rootDir)));

    return [...matches]
        .filter((match: string) => !excluded.has(match))
        .filter((match: string) => lockFileNames.some((lockFileName: string) => fs.existsSync(path.resolve(rootDir, match, lockFileName))))
        .map(toPosixPath)
        .sort();
};
