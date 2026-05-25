import { start, stop } from "./test-server/serve";

export async function setup(): Promise<void> {
    console.log("Starting test Server");
    await start();
}

export async function teardown(): Promise<void> {
    console.log("Stopping test Server...");
    await stop();
}
