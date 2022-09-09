
const config = {
    includePaths: ["./", "./packages/a", "./packages/b"],
    lockFileNames: ["package-lock.json"],
    prettier: {
        useTabs: true,
        endOfLine: "cr"
    }
};

module.exports = config;
