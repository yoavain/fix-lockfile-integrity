import pc from "picocolors";
import { main } from "./main";

// Run main
main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(pc.red(message));
    process.exit(1);
});
