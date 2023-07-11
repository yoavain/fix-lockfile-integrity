import { detectJsonStyle } from "../src";
import * as prettier from "prettier";

const mockJson = {
    x: 1,
    y: 2
};

describe("Test json utils", () => {
    it("Should detect TAB delimiter", () => {
        const jsonStyle = detectJsonStyle(JSON.stringify(mockJson, null, "\t"));
        expect(jsonStyle.useTabs).toBeTruthy();
    });
    it("Should detect 2 spaces delimiter", () => {
        const jsonStyle = detectJsonStyle(JSON.stringify(mockJson, null, 2));
        expect(jsonStyle.tabWidth).toEqual(2);
        expect(jsonStyle.useTabs).toBeFalsy();
    });
    it("Should detect LF end of line", () => {
        const jsonString = prettier.format(JSON.stringify(mockJson, null, 2), { parser: "json", endOfLine: "lf" });
        const jsonStyle = detectJsonStyle(jsonString);
        expect(jsonStyle.endOfLine).toEqual("lf");
    });
    it("Should detect CRLF end of line", () => {
        const jsonString = prettier.format(JSON.stringify(mockJson, null, 2), { parser: "json", endOfLine: "crlf" });
        const jsonStyle = detectJsonStyle(jsonString);
        expect(jsonStyle.endOfLine).toEqual("crlf");
    });
});