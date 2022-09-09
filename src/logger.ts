let quiet: boolean = false;
let verbose: boolean = false;

export const setQuiet = (value: boolean = true) => {
    quiet = value;
};
export const setVerbose = (value: boolean = true) => {
    verbose = value;
};

export const logger = {
    info: (message: string) => {
        if (!quiet) {
            console.info(message);
        }
    },
    verbose: (message: string) => {
        if (!quiet && verbose) {
            console.info(message);
        }
    },
    error: (message: string) => {
        console.error(message);
    },
    warn: (message: string) => {
        if (!quiet && verbose) {
            console.warn(message);
        }
    }
};
