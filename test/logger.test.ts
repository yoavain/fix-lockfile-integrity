import { logger, setQuiet, setVerbose } from "../src";

const loggerCallAll = () => {
    logger.info("Info");
    logger.verbose("Verbose");
    logger.warn("Warn");
    logger.error("Error");
};

describe("Test logger", () => {
    beforeEach(() => {
        jest.spyOn(console, "info").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
        jest.spyOn(console, "warn").mockImplementation(() => {});
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    it ("Test logger - normal", () => {
        setQuiet(false);
        setVerbose(false);

        loggerCallAll();

        expect(console.info).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it ("Test logger - verbose", () => {
        setQuiet(false);
        setVerbose(true);

        loggerCallAll();

        expect(console.info).toHaveBeenCalledTimes(2);
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it ("Test logger - quiet", () => {
        setQuiet(true);
        setVerbose(true); // to verify quiet suppresses verbose

        loggerCallAll();

        expect(console.info).toHaveBeenCalledTimes(0);
        expect(console.warn).toHaveBeenCalledTimes(0);
        expect(console.error).toHaveBeenCalledTimes(1);
    });
});