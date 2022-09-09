import chalk from "chalk";
import { main } from "./main";

// Run main
main().catch((message: string) => {
    console.error(chalk.red(message));
    process.exit(1);
});
