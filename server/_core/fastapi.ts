import type { Express, Request, Response } from "express";
import { request as httpRequest } from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import { join } from "node:path";

export const FASTAPI_PROXY_PREFIXES = ["/api/v1", "/docs", "/redoc", "/health"] as const;

const FASTAPI_HOST = "127.0.0.1";
let fastApiProcess: ChildProcess | undefined;

export function getFastApiInternalPort(environment = process.env.NODE_ENV): number {
  const defaultPort = environment === "development" ? "8100" : "8000";
  return Number.parseInt(process.env.FASTAPI_INTERNAL_PORT || defaultPort, 10);
}

export function shouldStartFastApiSidecar(
  environment = process.env.NODE_ENV,
  explicitOptIn = process.env.START_FASTAPI_SIDECAR,
): boolean {
  return environment !== "development" || explicitOptIn === "true";
}

function isInternalPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, FASTAPI_HOST, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}

export function isFastApiRoute(pathname: string): boolean {
  return FASTAPI_PROXY_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function logFastApiOutput(chunk: Buffer, stream: "stdout" | "stderr") {
  const message = chunk.toString().trim();
  if (message) console[stream === "stderr" ? "error" : "log"](`[FastAPI] ${message}`);
}

async function waitForFastApi(port: number): Promise<void> {
  const healthUrl = `http://${FASTAPI_HOST}:${port}/health`;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) return;
    } catch {
      // The Python process may still be importing its application modules.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("FastAPI did not become ready within 10 seconds.");
}

export async function startFastApiService(): Promise<number> {
  if (fastApiProcess) throw new Error("FastAPI service has already been started.");

  const port = getFastApiInternalPort();
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("FASTAPI_INTERNAL_PORT must be a valid non-privileged port.");
  }
  if (!(await isInternalPortAvailable(port))) {
    throw new Error(`FASTAPI_INTERNAL_PORT ${port} is already in use.`);
  }

  fastApiProcess = spawn(
    "python3",
    ["-m", "uvicorn", "app.main:app", "--host", FASTAPI_HOST, "--port", String(port), "--no-access-log"],
    {
      cwd: join(process.cwd(), "backend"),
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  fastApiProcess.stdout?.on("data", (chunk: Buffer) => logFastApiOutput(chunk, "stdout"));
  fastApiProcess.stderr?.on("data", (chunk: Buffer) => logFastApiOutput(chunk, "stderr"));
  fastApiProcess.once("exit", (code, signal) => {
    fastApiProcess = undefined;
    console.error(`[FastAPI] Process exited before shutdown (code=${code ?? "none"}, signal=${signal ?? "none"}).`);
  });

  try {
    await waitForFastApi(port);
  } catch (error) {
    fastApiProcess.kill("SIGTERM");
    fastApiProcess = undefined;
    throw error;
  }

  const stopFastApi = () => fastApiProcess?.kill("SIGTERM");
  process.once("SIGTERM", stopFastApi);
  process.once("SIGINT", stopFastApi);
  return port;
}

export function registerFastApiProxy(app: Express, port: number): void {
  app.use((req: Request, res: Response, next) => {
    if (!isFastApiRoute(req.path)) return next();

    const proxyRequest = httpRequest(
      {
        host: FASTAPI_HOST,
        port,
        method: req.method,
        path: req.originalUrl,
        headers: { ...req.headers, host: `${FASTAPI_HOST}:${port}` },
      },
      proxyResponse => {
        res.status(proxyResponse.statusCode || 502);
        for (const [name, value] of Object.entries(proxyResponse.headers)) {
          if (value !== undefined) res.setHeader(name, value);
        }
        proxyResponse.pipe(res);
      },
    );

    proxyRequest.on("error", error => {
      console.error(`[FastAPI] Proxy request failed: ${error.message}`);
      if (!res.headersSent) res.status(503).json({ detail: "Secure API is temporarily unavailable." });
      else res.end();
    });
    req.pipe(proxyRequest);
  });
}
