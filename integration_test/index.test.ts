import os from "os";
import path from "path";
import fs from "fs";
import { fixLockFile, FixLockFileResult } from "../src";

jest.setTimeout(30000);

const SHA512 = "sha512-longHash";
const SHA1 = "sha1-shortHash";

const LOCKFILE_WITH_SHA1 = {
    packageName: {
        version: "1.0.0",
        resolved: "https://registry.npmjs.org/packageName/-/packageName-1.0.0.tgz",
        integrity: SHA1
    }
};

describe("Integration test - fixLockFile", () => {
    let tempFilePath: string;

    beforeEach(() => {
        jest.spyOn(global, "fetch").mockResolvedValue({
            status: 200,
            json: jest.fn().mockResolvedValue({ dist: { integrity: SHA512 } })
        } as unknown as Response);
        tempFilePath = path.join(os.tmpdir(), `test-package-lock-${Date.now()}.json`);
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        try {
            await fs.promises.unlink(tempFilePath);
        }
        catch {
            // file may not exist
        }
    });

    it("should fix SHA1 integrity to SHA512", async () => {
        const jsonContent = JSON.stringify(LOCKFILE_WITH_SHA1, null, 2) + "\n";
        await fs.promises.writeFile(tempFilePath, jsonContent, "utf8");

        const result = await fixLockFile(tempFilePath);

        expect(result).toEqual(FixLockFileResult.FILE_FIXED);
        const fixedContent = await fs.promises.readFile(tempFilePath, "utf8");
        expect(fixedContent).toContain(SHA512);
        expect(fixedContent).not.toContain(SHA1);
    });
});
