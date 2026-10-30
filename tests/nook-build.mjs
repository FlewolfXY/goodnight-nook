import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.CLOUDFLARE_CF_FETCH_ENABLED = "false";
process.env.WRANGLER_SEND_METRICS = "false";
const { Miniflare } = await import("miniflare");
const project = fileURLToPath(new URL("..", import.meta.url));
const server = path.join(project, "dist/server");
const config = JSON.parse(await readFile(path.join(server, "wrangler.json"), "utf8"));
const hosting = JSON.parse(await readFile(path.join(project, "dist/.openai/hosting.json"), "utf8"));
const localHosting = JSON.parse(await readFile(path.join(project, ".openai/hosting.json"), "utf8"));
assert.equal(typeof localHosting.project_id, "string");
assert.ok(localHosting.project_id.length > 0, "Restore the original managed Site hosting config before a cloud build");
assert.equal(hosting.project_id, localHosting.project_id);
assert.equal(hosting.static, undefined);
assert.equal(hosting.d1, "DB");
assert.equal(config.assets.binding, "ASSETS");
assert.equal(config.assets.html_handling, "none");
assert.equal(config.assets.not_found_handling, "none");
assert.deepEqual(config.assets.run_worker_first, ["/", "/api/*"]);
assert.equal(path.resolve(server, config.assets.directory), path.join(project, "dist/client"));
assert.equal(config.d1_databases[0].binding, "DB");
const moduleFiles = (await readdir(server, { recursive: true }))
  .filter(file => /\.(?:m?js)$/.test(file))
  .sort((a, b) => a === config.main ? -1 : b === config.main ? 1 : a.localeCompare(b));

// This exercises the already-built Worker and its assets router directly.
// No preview or browser server is started or exposed to the user.
const mf = new Miniflare({
  name: config.name,
  modules: moduleFiles.map(file => ({ type: "ESModule", path: path.join(server, file) })),
  modulesRoot: server,
  compatibilityDate: config.compatibility_date,
  compatibilityFlags: config.compatibility_flags,
  d1Databases: { DB: "nook-built-route-fixture" },
  assets: {
    directory: path.resolve(server, config.assets.directory),
    binding: config.assets.binding,
    routerConfig: {
      has_user_worker: true,
      static_routing: { user_worker: config.assets.run_worker_first },
    },
    assetConfig: {
      html_handling: config.assets.html_handling,
      not_found_handling: config.assets.not_found_handling,
      has_static_routing: true,
    },
  },
});
const origin = "https://nook.example.test";
const identity = {
  "oai-authenticated-user-id": "built-smoke-owner",
  "oai-authenticated-user-email": "built-smoke@example.test",
};
try {
  const database = await mf.getD1Database("DB");
  const journal = JSON.parse(await readFile(path.join(project, "dist/.openai/drizzle/meta/_journal.json"), "utf8"));
  for (const entry of journal.entries) {
    const sql = await readFile(path.join(project, `dist/.openai/drizzle/${entry.tag}.sql`), "utf8");
    for (const statement of sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean)) {
      await database.prepare(statement).run();
    }
  }
  const home = await mf.dispatchFetch(`${origin}/`, { redirect: "manual" });
  assert.equal(home.status, 200);
  assert.equal(home.headers.get("location"), null);
  assert.match(home.headers.get("content-type"), /text\/html/);
  assert.equal(await home.text(), await readFile(path.join(project, "public/index.html"), "utf8"));

  for (const asset of ["scenes/moonlit-parlor-night.html", "scenes/moon-wolf-magic.html", "scenes/rain-glass-garden.html", "scenes/undersea-quilt-train.html", "scenes/comet-picnic-night.html", "scenes/moon-ink-studio.html", "scenes/cloud-cinema-night.html", "scenes/pine-bough-treehouse.html", "scenes/moon-pudding-parlor.html", "scenes/moon-bookbindery.html", "scenes/starlit-curio-attic.html", "scenes/moonlit-lost-and-found.html", "scenes/moss-moon-bathhouse.html", "scenes/moon-mushroom-post-office.html", "scenes/cloud-dryer-night.html", "scenes/moon-waterwheel-study.html", "scenes/moon-mending-shop.html", "scenes/pumpkin-cloud-teahouse.html", "outing-scenes.js", "outing-touch-lines.js", "outings.css", "theme-init.js", "cozy-scene.js", "app.js"]) {
    const response = await mf.dispatchFetch(`${origin}/${asset}`, { redirect: "manual" });
    assert.equal(response.status, 200, asset);
    assert.equal(response.headers.get("location"), null, asset);
    assert.equal(await response.text(), await readFile(path.join(project, "public", asset), "utf8"), asset);
  }

  const anonymous = await mf.dispatchFetch(`${origin}/api/nook-state`, { redirect: "manual" });
  assert.equal(anonymous.status, 401);
  assert.match(anonymous.headers.get("content-type"), /application\/json/);
  assert.equal((await anonymous.json()).error.code, "unauthenticated");
  const get = await mf.dispatchFetch(`${origin}/api/nook-state`, { headers: identity, redirect: "manual" });
  assert.equal(get.status, 200);
  const first = await get.json();
  assert.equal(first.scope, identity["oai-authenticated-user-id"]);
  assert.equal(first.state.pillow, false);
  assert.match(get.headers.get("cache-control"), /no-store/);

  const post = await mf.dispatchFetch(`${origin}/api/nook-state`, {
    method: "POST", redirect: "manual",
    headers: { ...identity, Origin: origin, "Sec-Fetch-Site": "same-origin", "Content-Type": "application/json", "X-Nook-Scope": first.scope },
    body: JSON.stringify({ op: "make-pillow" }),
  });
  assert.equal(post.status, 200);
  const saved = await post.json();
  assert.equal(saved.scope, first.scope);
  assert.equal(saved.state.pillow, true);
  assert.equal(saved.state.revision, 1);
  const again = await mf.dispatchFetch(`${origin}/api/nook-state`, { headers: identity });
  assert.deepEqual((await again.json()).state, saved.state);
  const trip = await mf.dispatchFetch(`${origin}/api/nook-state`, {
    method: "POST", headers: { ...identity, Origin: origin, "Content-Type": "application/json", "X-Nook-Scope": first.scope },
    body: JSON.stringify({ op: "keep-souvenir", souvenir: "moon-postmark" }),
  });
  assert.equal(trip.status, 200);
  const travelled = await trip.json();
  assert.deepEqual(travelled.state.souvenirs, ["moon-postmark"]);
  assert.equal(travelled.state.pillow, true);
  assert.equal(travelled.state.revision, saved.state.revision + 1);
  const returned = await mf.dispatchFetch(`${origin}/api/nook-state`, { headers: identity });
  assert.deepEqual((await returned.json()).state, travelled.state);
  console.log("PASS: built metadata and D1 migration; root HTML unchanged; .html scenes and assets 200 with no redirect; compiled auth route anonymous 401 and identified GET/POST persisted.");
} finally {
  await mf.dispose();
}
