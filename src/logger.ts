let quiet: boolean = false;
let verbose: boolean = false;

export const setQuiet = () => {
    quiet = true;
};
export const setVerbose = () => {
    verbose = true;
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
