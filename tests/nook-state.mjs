import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

process.env.CLOUDFLARE_CF_FETCH_ENABLED = "false";
process.env.WRANGLER_SEND_METRICS = "false";
const { Miniflare } = await import("miniflare");
const source = await readFile(new URL("../db/nook-state.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { handleNookState } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const mf = new Miniflare({
  modules: true,
  script: "export default { fetch() { return new Response('D1 integration fixture'); } }",
  compatibilityDate: "2026-05-15",
  d1Databases: { DB: "nook-state-integration" },
});
const origin = "https://goodnight-nook.xuyue189.chatgpt.site";

try {
  const database = await mf.getD1Database("DB");
  const journal = JSON.parse(await readFile(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"));
  for (const entry of journal.entries) {
    const migration = await readFile(new URL(`../drizzle/${entry.tag}.sql`, import.meta.url), "utf8");
    for (const sql of migration.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean)) {
      await database.prepare(sql).run();
    }
  }
  async function call(user = "owner", operation, extraHeaders = {}) {
    const method = operation === undefined ? "GET" : "POST";
    const request = new Request(`${origin}/api/nook-state`, {
      method,
      headers: method === "GET" ? extraHeaders : {
        Origin: origin,
        "Sec-Fetch-Site": "same-origin",
        "Content-Type": "application/json",
        "X-Nook-Scope": user || "owner",
        ...extraHeaders,
      },
      ...(method === "POST" ? { body: JSON.stringify(operation) } : {}),
    });
    const response = await handleNookState(request, () => database, user);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.match(response.headers.get("vary"), /Cookie/);
    return { status: response.status, ...(await response.json()) };
  }

  let touchedDatabase = false;
  const anonymous = await handleNookState(new Request(`${origin}/api/nook-state`), () => {
    touchedDatabase = true; return database;
  }, null);
  assert.equal(anonymous.status, 401);
  assert.equal(touchedDatabase, false);

  const initial = await call();
  assert.equal(initial.scope, "owner");
  assert.equal(initial.state.version, 1);
  assert.equal(initial.state.revision, 0);
  assert.equal(initial.state.paper, false);
  assert.equal(initial.state.pillow, false);
  assert.equal(initial.state.pillowWelcomed, false);
  assert.equal(initial.state.pillowPlace, "newton");
  assert.equal(initial.state.pillowMadeAt, null);
  assert.match(initial.state.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual((await call()).state, initial.state);

  const scopeFailure = await call("other", { op: "make-pillow" }, { "X-Nook-Scope": "owner" });
  assert.equal(scopeFailure.status, 403);
  assert.equal(scopeFailure.error.code, "scope_mismatch");
  for (const headers of [{ Origin: "https://elsewhere.example" }, { Origin: "null" }, { Origin: "" }, { "Sec-Fetch-Site": "cross-site" }]) {
    assert.equal((await call("owner", { op: "mark-paper" }, headers)).status, 403);
  }
  assert.equal((await call("owner", { op: "mark-paper" }, { "Content-Type": "text/plain" })).status, 415);
  for (const payload of [null, [], { op: "reset" }, { op: "make-pillow", userId: "other" }, { op: "place-pillow", place: "elsewhere" }, { op: "place-pillow" }, { op: "mark-paper", state: { paper: false } }]) {
    assert.equal((await call("owner", payload)).status, 400);
  }
  assert.equal((await call("owner", { op: "mark-paper", excess: "x".repeat(600) })).status, 413);
  assert.equal((await call("owner", { op: "welcome-pillow" })).status, 409);
  assert.equal((await call("owner", { op: "place-pillow", place: "wolf" })).status, 409);
  assert.deepEqual((await call()).state, initial.state);

  // Real concurrent D1 requests update different flags without replacing a row.
  const simultaneous = await Promise.all(Array.from({ length: 24 }, (_, i) => call("owner", { op: i % 2 ? "make-pillow" : "mark-paper" })));
  assert.ok(simultaneous.every(result => result.status === 200));
  const made = (await call()).state;
  assert.equal(made.paper, true);
  assert.equal(made.pillow, true);
  assert.equal(made.revision, 2);
  assert.ok(made.pillowMadeAt);
  assert.equal(made.createdAt, initial.state.createdAt);
  assert.deepEqual((await call("owner", { op: "make-pillow" })).state, made);
  assert.deepEqual((await call("owner", { op: "mark-paper" })).state, made);

  await Promise.all([
    call("owner", { op: "welcome-pillow" }),
    call("owner", { op: "place-pillow", place: "wolf" }),
  ]);
  const welcomed = (await call()).state;
  assert.equal(welcomed.pillowWelcomed, true);
  assert.equal(welcomed.pillowPlace, "wolf");
  assert.equal(welcomed.revision, 4);
  assert.deepEqual((await call("owner", { op: "welcome-pillow" })).state, welcomed);
  assert.deepEqual((await call("owner", { op: "place-pillow", place: "wolf" })).state, welcomed);
  const movedBack = await call("owner", { op: "place-pillow", place: "newton" });
  assert.equal(movedBack.state.revision, 5);
  assert.equal(movedBack.state.pillowPlace, "newton");
  assert.equal(movedBack.state.pillowMadeAt, made.pillowMadeAt);
  assert.equal(movedBack.state.pillowWelcomed, true);
  const other = await call("other");
  assert.equal(other.scope, "other");
  assert.equal(other.state.revision, 0);
  assert.equal(other.state.paper, false);
  assert.equal(other.state.pillow, false);
  assert.equal((await call("owner")).state.revision, 5);

  // New keepsakes are monotone, idempotent and independent of existing room objects.
  for (const payload of [{ op: "keep-souvenir" }, { op: "keep-souvenir", souvenir: "unknown" }, { op: "keep-souvenir", souvenir: "__proto__" }, { op: "keep-souvenir", souvenir: "moonflower", userId: "other" }]) {
    assert.equal((await call("owner", payload)).status, 400);
  }
  await Promise.all(Array.from({ length: 15 }, (_, i) => call("owner", { op: "keep-souvenir", souvenir: ["moonflower", "tide-ticket", "comet-bottle"][i % 3] })));
  const travelled = (await call()).state;
  assert.deepEqual(travelled.souvenirs, ["moonflower", "tide-ticket", "comet-bottle"]);
  assert.equal(travelled.revision, 8);
  assert.equal(travelled.pillow, true);
  assert.equal(travelled.pillowWelcomed, true);
  assert.equal(travelled.pillowPlace, "newton");
  assert.deepEqual((await call("owner", { op: "keep-souvenir", souvenir: "moonflower" })).state, travelled);
  assert.deepEqual((await call("other")).state.souvenirs, []);

  const ink = await call("owner", { op: "keep-souvenir", souvenir: "moon-ink" });
  assert.equal(ink.status, 200);
  assert.deepEqual(ink.state.souvenirs, ["moonflower", "tide-ticket", "comet-bottle", "moon-ink"]);
  assert.equal(ink.state.revision, travelled.revision + 1);
  assert.equal(ink.state.pillow, true);
  assert.deepEqual((await call("owner", { op: "keep-souvenir", souvenir: "moon-ink" })).state, ink.state);
  assert.deepEqual((await call("other")).state.souvenirs, []);

  const cinema = await call("owner", { op: "keep-souvenir", souvenir: "moon-reel-ticket" });
  assert.equal(cinema.status, 200);
  assert.deepEqual(cinema.state.souvenirs, [...ink.state.souvenirs, "moon-reel-ticket"]);
  assert.equal(cinema.state.revision, ink.state.revision + 1);
  assert.equal(cinema.state.pillow, true);
  assert.deepEqual((await call("owner", { op: "keep-souvenir", souvenir: "moon-reel-ticket" })).state, cinema.state);
  assert.deepEqual((await call("other")).state.souvenirs, []);

  const lamps = await Promise.all(Array.from({ length: 6 }, () => call("owner", { op: "keep-souvenir", souvenir: "pinecone-lamp" })));
  assert.ok(lamps.every(result => result.status === 200));
  const treehouse = (await call("owner")).state;
  assert.deepEqual(treehouse.souvenirs, [...cinema.state.souvenirs, "pinecone-lamp"]);
  assert.equal(treehouse.revision, cinema.state.revision + 1);
  for (const field of ["paper", "pillow", "pillowWelcomed", "pillowPlace", "pillowMadeAt", "createdAt"]) {
    assert.equal(treehouse[field], cinema.state[field], field);
  }
  assert.deepEqual((await call("owner", { op: "keep-souvenir", souvenir: "pinecone-lamp" })).state, treehouse);
  assert.deepEqual((await call("other")).state, other.state);

  assert.equal(await database.prepare("SELECT souvenirs FROM nook_states WHERE user_id = ?").bind("owner").first("souvenirs"), 63);
  const puddings = await Promise.all(Array.from({ length: 6 }, () => call("owner", { op: "keep-souvenir", souvenir: "moon-pudding-jar" })));
  assert.ok(puddings.every(result => result.status === 200));
  const dessert = (await call("owner")).state;
  assert.deepEqual(dessert.souvenirs, [...treehouse.souvenirs, "moon-pudding-jar"]);
  assert.equal(dessert.revision, treehouse.revision + 1);
  assert.equal(await database.prepare("SELECT souvenirs FROM nook_states WHERE user_id = ?").bind("owner").first("souvenirs"), 127);
  for (const field of ["paper", "pillow", "pillowWelcomed", "pillowPlace", "pillowMadeAt", "createdAt"]) {
    assert.equal(dessert[field], treehouse[field], field);
  }
  assert.deepEqual((await call("owner", { op: "keep-souvenir", souvenir: "moon-pudding-jar" })).state, dessert);
  assert.deepEqual((await call("other")).state, other.state);

  const books = await Promise.all(Array.from({ length: 6 }, () => call("owner", { op: "keep-souvenir", souvenir: "moon-book" })));
  assert.ok(books.every(result => result.status === 200));
  const bindery = (await call("owner")).state;
  assert.deepEqual(bindery.souvenirs, [...dessert.souvenirs, "moon-book"]);
  assert.equal(bindery.revision, dessert.revision + 1);
  assert.equal(await database.prepare("SELECT souvenirs FROM nook_states WHERE user_id = ?").bind("owner").first("souvenirs"), 255);
  for (const field of ["paper", "pillow", "pillowWelcomed", "pillowPlace", "pillowMadeAt", "createdAt"]) {
    assert.equal(bindery[field], dessert[field], field);
  }
  assert.deepEqual((await call("owner", { op: "keep-souvenir", souvenir: "moon-book" })).state, bindery);
  assert.deepEqual((await call("other")).state, other.state);

  const keys = await Promise.all(Array.from({ length: 6 }, () => call("owner", { op: "keep-souvenir", souvenir: "tiny-room-key" })));
  assert.ok(keys.every(result => result.status === 200));
  const curio = (await call("owner")).state;
  assert.deepEqual(curio.souvenirs, [...bindery.souvenirs, "tiny-room-key"]);
  assert.equal(curio.revision, bindery.revision + 1);
  assert.equal(await database.prepare("SELECT souvenirs FROM nook_states WHERE user_id = ?").bind("owner").first("souvenirs"), 511);
  for (const field of ["paper", "pillow", "pillowWelcomed", "pillowPlace", "pillowMadeAt", "createdAt"]) {
    assert.equal(curio[field], bindery[field], field);
  }
  assert.deepEqual((await call("owner", { op: "keep-souvenir", souvenir: "tiny-room-key" })).state, curio);
  assert.deepEqual((await call("other")).state, other.state);

  const clouds = await Promise.all(Array.from({ length: 6 }, () => call("owner", { op: "keep-souvenir", souvenir: "pocket-cloud" })));
  assert.ok(clouds.every(result => result.status === 200));
  const lost = (await call("owner")).state;
  assert.deepEqual(lost.souvenirs, [...curio.souvenirs, "pocket-cloud"]);
  assert.equal(lost.revision, curio.revision + 1);
  assert.equal(await database.prepare("SELECT souvenirs FROM nook_states WHERE user_id = ?").bind("owner").first("souvenirs"), 1023);
  for (const field of ["paper", "pillow", "pillowWelcomed", "pillowPlace", "pillowMadeAt", "createdAt"]) {
    assert.equal(lost[field], curio[field], field);
  }
  assert.deepEqual((await call("owner", { op: "keep-souvenir", souvenir: "pocket-cloud" })).state, lost);
  assert.deepEqual((await call("other")).state, other.state);

  const boats = await Promise.all(Array.from({ length: 6 }, () => call("owner", { op: "keep-souvenir", souvenir: "moon-leaf-boat" })));
  assert.ok(boats.every(result => result.status === 200));
  const bath = (await call("owner")).state;
  assert.deepEqual(bath.souvenirs, [...lost.souvenirs, "moon-leaf-boat"]);
  assert.equal(bath.revision, lost.revision + 1);
  assert.equal(await database.prepare("SELECT souvenirs FROM nook_states WHERE user_id = ?").bind("owner").first("souvenirs"), 2047);
  for (const field of ["paper", "pillow", "pillowWelcomed", "pillowPlace", "pillowMadeAt", "createdAt"]) {
    assert.equal(bath[field], lost[field], field);
  }
  assert.deepEqual((await call("owner", { op: "keep-souvenir", souvenir: "moon-leaf-boat" })).state, bath);
  assert.deepEqual((await call("other")).state, other.state);

  const postmarks = await Promise.all(Array.from({ length: 6 }, () => call("owner", { op: "keep-souvenir", souvenir: "moon-postmark" })));
  assert.ok(postmarks.every(result => result.status === 200));
  const postOffice = (await call("owner")).state;
  assert.deepEqual(postOffice.souvenirs, [...bath.souvenirs, "moon-postmark"]);
  assert.equal(postOffice.revision, bath.revision + 1);
  assert.equal(await database.prepare("SELECT souvenirs FROM nook_states WHERE user_id = ?").bind("owner").first("souvenirs"), 4095);
  for (const field of ["paper", "pillow", "pillowWelcomed", "pillowPlace", "pillowMadeAt", "createdAt"]) {
    assert.equal(postOffice[field], bath[field], field);
  }
  assert.deepEqual((await call("owner", { op: "keep-souvenir", souvenir: "moon-postmark" })).state, postOffice);
  assert.deepEqual((await call("other")).state, other.state);

  // Schema constraints independently reject impossible persisted states.
  await assert.rejects(database.prepare("UPDATE nook_states SET pillow_place = ? WHERE user_id = ?").bind("invalid", "owner").run());
  await assert.rejects(database.prepare("UPDATE nook_states SET pillow_welcomed = 1 WHERE user_id = ?").bind("other").run());
  const failure = await handleNookState(new Request(`${origin}/api/nook-state`), () => { throw new Error("missing binding"); }, "owner");
  assert.equal(failure.status, 503);

  console.log("PASS: real local D1 migration; identity/scope/origin isolation; strict payloads; concurrent monotone writes; idempotency; timestamps/revisions; durable independent user reads; DB constraints.");
} finally {
  await mf.dispose();
}
