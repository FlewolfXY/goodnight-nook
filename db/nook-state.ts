export type NookState = {
  version: 1;
  souvenirs: string[];
  paper: boolean;
  pillow: boolean;
  pillowWelcomed: boolean;
  pillowPlace: "newton" | "wolf";
  createdAt: string;
  pillowMadeAt: string | null;
  updatedAt: string;
  revision: number;
};

type StoredState = {
  version: number;
  souvenirs: number;
  paper: number;
  pillow: number;
  pillow_welcomed: number;
  pillow_place: "newton" | "wolf";
  created_at: string;
  pillow_made_at: string | null;
  updated_at: string;
  revision: number;
};

type Operation =
  | { op: "mark-paper" | "make-pillow" | "welcome-pillow" }
  | { op: "keep-souvenir"; souvenir: keyof typeof souvenirBits }
  | { op: "place-pillow"; place: "newton" | "wolf" };

const souvenirBits = { "moonflower": 1, "tide-ticket": 2, "comet-bottle": 4, "moon-ink": 8, "moon-reel-ticket": 16, "pinecone-lamp": 32, "moon-pudding-jar": 64, "moon-book": 128, "tiny-room-key": 256, "pocket-cloud": 512, "moon-leaf-boat": 1024, "moon-postmark": 2048 } as const;

const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Vary": "Cookie, oai-authenticated-user-id",
  "X-Content-Type-Options": "nosniff",
};
const selectSql = `SELECT version, souvenirs, paper, pillow, pillow_welcomed, pillow_place,
  created_at, pillow_made_at, updated_at, revision FROM nook_states WHERE user_id = ?`;
const createSql = `INSERT INTO nook_states (user_id, created_at, updated_at)
  VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING`;
const advanceSql = "revision = revision + 1, updated_at = MAX(updated_at, ?)";
const maxBodyBytes = 512;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: responseHeaders });
}
function error(code: string, message: string, status: number, extra = {}) {
  return json({ error: { code, message }, ...extra }, status);
}
function publicState(row: StoredState): NookState {
  return {
    version: 1,
    souvenirs: Object.entries(souvenirBits).filter(([, bit]) => (row.souvenirs & bit) !== 0).map(([name]) => name),
    paper: row.paper === 1,
    pillow: row.pillow === 1,
    pillowWelcomed: row.pillow_welcomed === 1,
    pillowPlace: row.pillow_place,
    createdAt: row.created_at,
    pillowMadeAt: row.pillow_made_at,
    updatedAt: row.updated_at,
    revision: row.revision,
  };
}
function validOperation(body: unknown): body is Operation {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const data = body as Record<string, unknown>;
  const keys = Object.keys(data).sort().join(",");
  if (data.op === "keep-souvenir") {
    return keys === "op,souvenir" && typeof data.souvenir === "string" && Object.hasOwn(souvenirBits, data.souvenir);
  }
  if (data.op === "place-pillow") {
    return keys === "op,place" && (data.place === "newton" || data.place === "wolf");
  }
  return keys === "op" && ["mark-paper", "make-pillow", "welcome-pillow"].includes(String(data.op));
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_json");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBodyBytes) {
        await reader.cancel();
        throw new Error("body_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

// Dispatch supplies the identity; callers cannot choose a scope in the payload.
// Dependency injection keeps the exact HTTP/SQL behavior testable with local D1.
export async function handleNookState(
  request: Request,
  getDatabase: () => D1Database,
  userId: string | null,
): Promise<Response> {
  if (!userId) return error("unauthenticated", "请先登录，再打开小窝存档。", 401);
  if (request.method !== "GET" && request.method !== "POST") {
    const response = error("method_not_allowed", "此处仅接受 GET 或 POST。", 405);
    response.headers.set("Allow", "GET, POST");
    return response;
  }

  let operation: Operation | undefined;
  if (request.method === "POST") {
    if (request.headers.get("X-Nook-Scope") !== userId) {
      return error("scope_mismatch", "登录身份已变化，请重新打开小窝存档。", 403);
    }
    const origin = request.headers.get("Origin");
    const site = request.headers.get("Sec-Fetch-Site");
    if (origin !== new URL(request.url).origin || (site && site !== "same-origin")) {
      return error("origin_not_allowed", "请从小窝页面保存。", 403);
    }
    if (request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
      return error("invalid_content_type", "请发送 JSON 操作。", 415);
    }
    if (Number(request.headers.get("Content-Length")) > maxBodyBytes) {
      return error("body_too_large", "操作内容过长。", 413);
    }
    let body: unknown;
    try { body = await readBoundedJson(request); }
    catch (cause) {
      return cause instanceof Error && cause.message === "body_too_large"
        ? error("body_too_large", "操作内容过长。", 413)
        : error("invalid_json", "操作内容不是有效 JSON。", 400);
    }
    if (!validOperation(body)) return error("invalid_operation", "这个小窝操作无法识别。", 400);
    operation = body;
  }

  try {
    const database = getDatabase();
    const now = new Date().toISOString();
    const statements = [database.prepare(createSql).bind(userId, now, now)];
    if (operation?.op === "keep-souvenir") {
      const bit = souvenirBits[operation.souvenir];
      statements.push(database.prepare(`UPDATE nook_states SET souvenirs = souvenirs | ?, ${advanceSql}
        WHERE user_id = ? AND (souvenirs & ?) = 0`).bind(bit, now, userId, bit));
    } else if (operation?.op === "mark-paper") {
      statements.push(database.prepare(`UPDATE nook_states SET paper = 1, ${advanceSql}
        WHERE user_id = ? AND paper = 0`).bind(now, userId));
    } else if (operation?.op === "make-pillow") {
      statements.push(database.prepare(`UPDATE nook_states SET pillow = 1, pillow_made_at = MAX(created_at, ?), ${advanceSql}
        WHERE user_id = ? AND pillow = 0`).bind(now, now, userId));
    } else if (operation?.op === "welcome-pillow") {
      statements.push(database.prepare(`UPDATE nook_states SET pillow_welcomed = 1, ${advanceSql}
        WHERE user_id = ? AND pillow = 1 AND pillow_welcomed = 0`).bind(now, userId));
    } else if (operation?.op === "place-pillow") {
      statements.push(database.prepare(`UPDATE nook_states SET pillow_place = ?, ${advanceSql}
        WHERE user_id = ? AND pillow = 1 AND pillow_place <> ?`).bind(operation.place, now, userId, operation.place));
    }
    statements.push(database.prepare(selectSql).bind(userId));
    // D1 batch is transactional: field-specific updates and the read share one
    // ordered batch, so concurrent clients cannot replace one another's flags.
    const results = await database.batch<StoredState>(statements);
    const row = results.at(-1)?.results[0];
    if (!row) throw new Error("nook_state_missing");
    const state = publicState(row);
    if ((operation?.op === "welcome-pillow" || operation?.op === "place-pillow") && !state.pillow) {
      return error("pillow_not_made", "先把炒冰枕头做好，再给它安放位置。", 409, { scope: userId, state });
    }
    return json({ scope: userId, state });
  } catch {
    return error("storage_unavailable", "小窝存档暂时没连上，请稍后再试。", 503);
  }
}
