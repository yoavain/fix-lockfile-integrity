import fs from "fs";
import os from "os";
import path from "path";
import { getWorkspacePaths, getWorkspacePatterns } from "../src";

const LOCK_FILE_NAMES = ["package-lock.json", "npm-shrinkwrap.json"];

describe("Test workspaces", () => {
    let rootDir: string;

    beforeEach(() => {
        rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "fix-lockfile-workspaces-"));
    });

    afterEach(() => {
        fs.rmSync(rootDir, { recursive: true, force: true });
    });

    const writeFile = (relativePath: string, content: string) => {
        const filePath: string = path.resolve(rootDir, relativePath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content, "utf8");
    };

    const writeJson = (relativePath: string, content: unknown) => writeFile(relativePath, JSON.stringify(content));

    const writePackage = (relativePath: string, lockFileName?: string) => {
        writeJson(`${relativePath}/package.json`, { name: relativePath });
        if (lockFileName) {
            writeJson(`${relativePath}/${lockFileName}`, {});
        }
    };

    describe("getWorkspacePatterns", () => {
        it("Should read npm workspaces array", () => {
            writeJson("package.json", { workspaces: ["packages/*"] });

            expect(getWorkspacePatterns(rootDir)).toEqual(["packages/*"]);
        });

        it("Should read yarn workspaces object", () => {
            writeJson("package.json", { workspaces: { packages: ["libs/*"], nohoist: ["**/react"] } });

            expect(getWorkspacePatterns(rootDir)).toEqual(["libs/*"]);
        });

        it("Should read lerna packages", () => {
            writeJson("package.json", { name: "root" });
            writeJson("lerna.json", { version: "1.0.0", packages: ["apps/*"] });

            expect(getWorkspacePatterns(rootDir)).toEqual(["apps/*"]);
        });

        it("Should use the lerna default when lerna.json has no packages", () => {
            writeJson("lerna.json", { version: "1.0.0" });

            expect(getWorkspacePatterns(rootDir)).toEqual(["packages/*"]);
        });

        it("Should prefer package.json workspaces over lerna.json", () => {
            writeJson("package.json", { workspaces: ["libs/*"] });
            writeJson("lerna.json", { packages: ["apps/*"] });

            expect(getWorkspacePatterns(rootDir)).toEqual(["libs/*"]);
        });

        it("Should return no patterns without a workspace definition", () => {
            writeJson("package.json", { name: "root" });

            expect(getWorkspacePatterns(rootDir)).toEqual([]);
        });

        it("Should return no patterns without any file", () => {
            expect(getWorkspacePatterns(rootDir)).toEqual([]);
        });

        it("Should fall back to lerna.json on invalid package.json", () => {
            writeFile("package.json", "{ this is not json");
            writeJson("lerna.json", { packages: ["apps/*"] });

            expect(getWorkspacePatterns(rootDir)).toEqual(["apps/*"]);
        });

        it("Should return no patterns on invalid lerna.json", () => {
            writeFile("lerna.json", "{ this is not json");

            expect(getWorkspacePatterns(rootDir)).toEqual([]);
        });

        it("Should return an empty workspaces array as is", () => {
            writeJson("package.json", { workspaces: [] });
            writeJson("lerna.json", { packages: ["apps/*"] });

            expect(getWorkspacePatterns(rootDir)).toEqual([]);
        });
    });

    describe("getWorkspacePaths", () => {
        it("Should find only workspaces that hold a lock file", () => {
            writeJson("package.json", { workspaces: ["packages/*"] });
            writePackage("packages/a", "package-lock.json");
            writePackage("packages/b", "npm-shrinkwrap.json");
            writePackage("packages/c");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual(["./packages/a", "./packages/b"]);
        });

        it("Should look for the configured lock file names only", () => {
            writeJson("package.json", { workspaces: ["packages/*"] });
            writePackage("packages/a", "package-lock.json");
            writePackage("packages/b", "npm-shrinkwrap.json");

            expect(getWorkspacePaths(rootDir, ["npm-shrinkwrap.json"])).toEqual(["./packages/b"]);
        });

        it("Should expand more than one pattern", () => {
            writeJson("package.json", { workspaces: ["apps/*", "libs/*"] });
            writePackage("apps/one", "package-lock.json");
            writePackage("libs/two", "package-lock.json");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual(["./apps/one", "./libs/two"]);
        });

        it("Should handle a negated pattern", () => {
            writeJson("package.json", { workspaces: ["packages/*", "!packages/skipped"] });
            writePackage("packages/kept", "package-lock.json");
            writePackage("packages/skipped", "package-lock.json");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual(["./packages/kept"]);
        });

        it("Should handle a nested pattern", () => {
            writeJson("package.json", { workspaces: ["packages/**"] });
            writePackage("packages/group/nested", "package-lock.json");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual(["./packages/group/nested"]);
        });

        it("Should handle an explicit folder without a pattern", () => {
            writeJson("package.json", { workspaces: ["packages/only"] });
            writePackage("packages/only", "package-lock.json");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual(["./packages/only"]);
        });

        it("Should find lerna packages", () => {
            writeJson("lerna.json", { packages: ["apps/*"] });
            writePackage("apps/one", "package-lock.json");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual(["./apps/one"]);
        });

        it("Should return no paths without a workspace definition", () => {
            writeJson("package.json", { name: "root" });
            writePackage("packages/a", "package-lock.json");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual([]);
        });

        it("Should return no paths when no workspace holds a lock file", () => {
            writeJson("package.json", { workspaces: ["packages/*"] });
            writePackage("packages/a");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual([]);
        });

        it("Should ignore a pattern that matches a file", () => {
            writeJson("package.json", { workspaces: ["packages/*"] });
            writeFile("packages/readme.md", "not a folder");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual([]);
        });

        it("Should ignore an empty pattern", () => {
            writeJson("package.json", { workspaces: ["", "packages/*"] });
            writePackage("packages/a", "package-lock.json");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual(["./packages/a"]);
        });

        it("Should ignore a pattern that is not a string", () => {
            writeJson("package.json", { workspaces: [42, null, "packages/*"] });
            writePackage("packages/a", "package-lock.json");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual(["./packages/a"]);
        });

        it("Should return the root folder as ./", () => {
            writeJson("package.json", { workspaces: ["**"] });
            writeJson("package-lock.json", {});
            writePackage("packages/a", "package-lock.json");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual(["./", "./packages/a"]);
        });

        it("Should return the paths without duplicates and in a stable order", () => {
            writeJson("package.json", { workspaces: ["packages/*", "packages/b", "apps/*"] });
            writePackage("packages/a", "package-lock.json");
            writePackage("packages/b", "package-lock.json");
            writePackage("apps/one", "package-lock.json");

            expect(getWorkspacePaths(rootDir, LOCK_FILE_NAMES)).toEqual(["./apps/one", "./packages/a", "./packages/b"]);
        });
    });
});
