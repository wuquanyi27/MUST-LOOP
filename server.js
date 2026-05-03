const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const HTML_FILE = path.join(ROOT_DIR, "MUSTLOOP.html");
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT_DIR, "data"));
const STORE_FILE = process.env.STORE_FILE
    ? path.resolve(process.env.STORE_FILE)
    : path.join(DATA_DIR, "store.json");
const BODY_LIMIT_BYTES = Number(process.env.BODY_LIMIT_BYTES || 10 * 1024 * 1024);

const STATE_KEYS = [
    "registeredUsers",
    "allItems",
    "allSkills",
    "allProjects",
    "allTasks",
    "chatThreads"
];

let writeQueue = Promise.resolve();
let appState = null;
let seedCache = null;

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function setCommonHeaders(res) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
}

function sendJson(res, statusCode, payload) {
    setCommonHeaders(res);
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    });
    res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, message) {
    setCommonHeaders(res);
    res.writeHead(statusCode, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
    });
    res.end(message);
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".html") return "text/html; charset=utf-8";
    if (ext === ".js") return "application/javascript; charset=utf-8";
    if (ext === ".json") return "application/json; charset=utf-8";
    if (ext === ".css") return "text/css; charset=utf-8";
    if (ext === ".svg") return "image/svg+xml";
    if (ext === ".png") return "image/png";
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".ico") return "image/x-icon";
    return "application/octet-stream";
}

function extractInlineScript(html) {
    const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    return matches.length ? matches[matches.length - 1][1] : "";
}

function buildSeedStateFromHtml() {
    if (seedCache) return clone(seedCache);

    const html = fs.readFileSync(HTML_FILE, "utf8");
    const script = extractInlineScript(html);
    const start = script.indexOf("const store = {");
    const end = script.indexOf("// ==================== 渲染卡片 ====================");

    if (start < 0 || end < 0) {
        throw new Error("无法从当前前端页面提取初始数据。");
    }

    const snippet = script.slice(start, end);
    const context = { result: null };
    vm.createContext(context);
    vm.runInContext(`${snippet}\ninitDemoData(); result = store;`, context);

    seedCache = {
        registeredUsers: clone(context.result.registeredUsers || []),
        allItems: clone(context.result.allItems || []),
        allSkills: clone(context.result.allSkills || []),
        allProjects: clone(context.result.allProjects || []),
        allTasks: clone(context.result.allTasks || []),
        chatThreads: [],
        meta: {
            serverVersion: 0,
            initializedAt: new Date().toISOString()
        }
    };

    return clone(seedCache);
}

function normalizeState(rawState, previousState = buildSeedStateFromHtml()) {
    const next = buildSeedStateFromHtml();
    const incoming = rawState && typeof rawState === "object" ? rawState : {};

    for (const key of STATE_KEYS) {
        next[key] = Array.isArray(incoming[key]) ? incoming[key] : clone(previousState[key] || []);
    }

    next.meta = {
        ...(previousState.meta || {}),
        ...(incoming.meta && typeof incoming.meta === "object" ? incoming.meta : {})
    };
    next.meta.serverVersion = Number(previousState.meta?.serverVersion || 0);
    return next;
}

async function ensureStore() {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    try {
        const raw = await fsp.readFile(STORE_FILE, "utf8");
        appState = normalizeState(JSON.parse(raw));
    } catch (error) {
        appState = buildSeedStateFromHtml();
        await fsp.writeFile(STORE_FILE, JSON.stringify(appState, null, 2), "utf8");
    }
}

function queueStoreWrite(nextState) {
    appState = nextState;
    writeQueue = writeQueue.then(() =>
        fsp.writeFile(STORE_FILE, JSON.stringify(appState, null, 2), "utf8")
    );
    return writeQueue;
}

async function readRequestBody(req) {
    let body = "";
    for await (const chunk of req) {
        body += chunk;
        if (body.length > BODY_LIMIT_BYTES) {
            const error = new Error("Payload too large");
            error.statusCode = 413;
            throw error;
        }
    }

    if (!body) return {};

    try {
        return JSON.parse(body);
    } catch (error) {
        const parseError = new Error("请求体不是合法的 JSON。");
        parseError.statusCode = 400;
        throw parseError;
    }
}

async function handleApiState(req, res) {
    if (req.method === "GET") {
        return sendJson(res, 200, {
            state: appState,
            serverTime: new Date().toISOString()
        });
    }

    if (req.method === "PUT") {
        const body = await readRequestBody(req);
        const incoming = normalizeState(body.state, appState);
        const clientVersion = Number(body?.state?.meta?.serverVersion ?? -1);
        const serverVersion = Number(appState.meta?.serverVersion || 0);

        if (clientVersion !== serverVersion) {
            return sendJson(res, 409, {
                error: "STATE_VERSION_CONFLICT",
                message: "服务器上已经有更新的数据，请先拉取最新状态。",
                state: appState
            });
        }

        incoming.meta.serverVersion = serverVersion + 1;
        incoming.meta.updatedAt = new Date().toISOString();
        await queueStoreWrite(incoming);
        return sendJson(res, 200, { state: appState });
    }

    return sendJson(res, 405, { error: "METHOD_NOT_ALLOWED" });
}

async function serveStatic(res, pathname) {
    const requestedPath = pathname === "/"
        ? HTML_FILE
        : path.join(ROOT_DIR, pathname.replace(/^\/+/, ""));
    const normalizedPath = path.normalize(requestedPath);

    if (!normalizedPath.startsWith(ROOT_DIR)) {
        return sendText(res, 403, "Forbidden");
    }

    try {
        const stats = await fsp.stat(normalizedPath);
        if (!stats.isFile()) {
            return sendText(res, 404, "Not Found");
        }

        setCommonHeaders(res);
        res.writeHead(200, {
            "Content-Type": getContentType(normalizedPath),
            "Cache-Control": normalizedPath.endsWith(".html") ? "no-store" : "public, max-age=300"
        });
        fs.createReadStream(normalizedPath).pipe(res);
    } catch (error) {
        sendText(res, 404, "Not Found");
    }
}

async function requestHandler(req, res) {
    try {
        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

        if (url.pathname === "/api/health") {
            return sendJson(res, 200, {
                ok: true,
                serverTime: new Date().toISOString(),
                version: Number(appState?.meta?.serverVersion || 0)
            });
        }

        if (url.pathname === "/api/state") {
            return handleApiState(req, res);
        }

        return serveStatic(res, url.pathname);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return sendJson(res, statusCode, {
            error: statusCode === 500 ? "INTERNAL_SERVER_ERROR" : error.message,
            message: error.message || "服务器内部错误。"
        });
    }
}

async function main() {
    await ensureStore();

    const server = http.createServer((req, res) => {
        requestHandler(req, res);
    });

    server.listen(PORT, HOST, () => {
        console.log(`MustLoop server running at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
        console.log(`Store file: ${STORE_FILE}`);
    });

    const shutdown = (signal) => {
        console.log(`${signal} received, shutting down MustLoop server...`);
        server.close(() => {
            console.log("MustLoop server stopped.");
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 8000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
