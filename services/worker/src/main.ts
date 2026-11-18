import "./instrument.js";
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { WorkerModule } from "./worker.module.js";

// No HTTP server: an application context that runs the BullMQ processors.
const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
app.useLogger(app.get(Logger));

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
