import fs from "node:fs/promises";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";

const PUBLIC_DIR: string = path.resolve(import.meta.dirname, "pages");

function returnContent(
    res: ServerResponse,
    content: string | Buffer,
    httpCode: number,
): void {
    const DEFAULT_HEADERS: Record<string, string> = {
        "Content-Type": "text/html; charset=utf-8",
    };

    res.writeHead(httpCode, DEFAULT_HEADERS);
    res.end(content, "utf8");
}

const server = http.createServer(
    async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
        try {
            const parsedUrl = new URL(
                req.url ?? "/",
                `http://${req.headers.host ?? "localhost"}`,
            );
            let pathname: string = decodeURIComponent(parsedUrl.pathname);

            if (pathname.includes("\0")) {
                returnContent(res, "400 Bad Request", 400);
                return;
            }

            if (pathname === "/") {
                pathname = "/index.html";
            }

            if (!pathname.endsWith(".html")) {
                returnContent(res, "404 Not Found", 404);
                return;
            }

            const filePath: string = path.join(PUBLIC_DIR, pathname);

            if (!filePath.startsWith(PUBLIC_DIR)) {
                returnContent(res, "403 Forbidden", 403);
                return;
            }

            const content = await fs.readFile(filePath);
            returnContent(res, content, 200);
        } catch {
            returnContent(res, "404 Not Found", 404);
            return;
        }
    },
);

export function start(): Promise<number> {
    return new Promise((resolve, reject) => {
        server.listen(0, () => {
            const address = server.address();

            if (!address || typeof address === "string") {
                reject(new Error("Could not determine server port"));
                return;
            }

            const { port } = address;

            process.env.FK_AXE_SERVER_PORT = port.toString();
            console.log(`Started http://localhost:${port}`);

            resolve(port);
        });
    });
}

export function stop(): Promise<void> {
    return new Promise((resolve, reject) => {
        server.close((err?: Error) => {
            if (err) {
                console.error("Could not stop server:", err);
                reject(err);
                return;
            }
            console.log("Server stopped");
            resolve();
        });
    });
}
