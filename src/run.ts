import chalk from "chalk";
import { main } from "./main";

// Run main
main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exit(1);
});
