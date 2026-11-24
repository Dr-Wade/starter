import "./instrument.js";
import "reflect-metadata";

import { AppConfig } from "./config/app-config.js";
import { createApp } from "./setup-app.js";

const { app } = await createApp();

// Swarm stops a container with SIGTERM and SIGKILLs it 10 s later. Node as PID 1
// has no default SIGTERM action, and Nest's enableShutdownHooks() re-raises the
// signal after closing, which PID 1 ignores: any timer or open handle then keeps
// the process alive until the SIGKILL. Close (in-flight work finishes, shutdown
// hooks run), then exit.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
        app.close().then(() => process.exit(0), () => process.exit(1));
    });
}

await app.listen(app.get(AppConfig).env.API_PORT);
