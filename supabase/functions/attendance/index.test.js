const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadHandler(options = {}) {
  const files = ["shared.ts", "get.ts", "post.ts", "index.ts"];
  const source = files
    .map((file) => fs.readFileSync(__dirname + "/" + file, "utf8"))
    .map((content) =>
      content
        .replace(/^\/\/\/.*\n/gm, "")
        .replace(/^import .*\n/gm, "")
        .replace(/^export /gm, "")
        .replace(/!;/g, ";")
        .replace(/: number/g, "")
        .replace(/: string \| null/g, "")
        .replace(/: HeadersInit/g, "")
        .replace(/: Request/g, "")
        .replace(/: Record<string, unknown>/g, "")
        .replace(/: unknown/g, "")
    )
    .join("\n");

  const state = {
    env: {
      SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_SERVICE_ROLE_KEY: "test-key",
    },
    events: [],
    listResult: options.listResult ?? { data: [], error: null },
    singleResult: options.singleResult ?? { data: { id: 1 }, error: null },
  };

  function makeQueryBuilder(table) {
    const event = {
      table,
      inserted: null,
      updated: null,
      selected: null,
      ordered: null,
      eq: null,
      mode: null,
    };

    return {
      insert(values) {
        event.inserted = values;
        return this;
      },
      update(values) {
        event.updated = values;
        return this;
      },
      select(columns) {
        event.selected = columns;
        return this;
      },
      order(column, options) {
        event.ordered = { column, options };
        return this;
      },
      eq(column, value) {
        event.eq = { column, value };
        return this;
      },
      single() {
        event.mode = "single";
        state.events.push({ ...event });
        return Promise.resolve(state.singleResult);
      },
      then(resolve, reject) {
        event.mode = "list";
        state.events.push({ ...event });
        return Promise.resolve(state.listResult).then(resolve, reject);
      },
    };
  }

  function createClient() {
    return {
      from(table) {
        return makeQueryBuilder(table);
      },
    };
  }

  const context = {
    URL,
    Request,
    Response,
    JSON,
    Number,
    String,
    Promise,
    console,
    createClient,
    Deno: {
      env: { get: (key) => state.env[key] },
      serve: (fn) => {
        context.__handler = fn;
      },
    },
  };
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(source, context);

  return {
    state,
    handler: context.__handler,
  };
}

async function readJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function toPlainJson(value) {
  return JSON.parse(JSON.stringify(value));
}

test("GET /attendance returns ordered list", async () => {
  const { handler, state } = loadHandler({
    listResult: {
      data: [{ id: 1, user_id: 10, state: 0, updated_dt: "2026-03-25 09:00:00" }],
      error: null,
    },
  });

  const response = await handler(new Request("http://localhost/attendance"));
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(body, [
    { id: 1, user_id: 10, state: 0, updated_dt: "2026-03-25 09:00:00" },
  ]);
  assert.deepEqual(toPlainJson(state.events[0]), {
    table: "attendance",
    inserted: null,
    updated: null,
    selected: "*",
    ordered: { column: "id", options: { ascending: true } },
    eq: null,
    mode: "list",
  });
});

test("GET /attendance?user_id=123 filters by user_id", async () => {
  const { handler, state } = loadHandler();

  const response = await handler(
    new Request("http://localhost/attendance?user_id=123"),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(toPlainJson(state.events[0]), {
    table: "attendance",
    inserted: null,
    updated: null,
    selected: "*",
    ordered: { column: "id", options: { ascending: true } },
    eq: { column: "user_id", value: 123 },
    mode: "list",
  });
});

test("GET /attendance returns empty array when no records exist", async () => {
  const { handler } = loadHandler({
    listResult: { data: [], error: null },
  });

  const response = await handler(new Request("http://localhost/attendance"));
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(body, []);
});

test("GET /attendance rejects invalid user_id", async () => {
  const { handler, state } = loadHandler();

  const response = await handler(
    new Request("http://localhost/attendance?user_id=abc"),
  );
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.deepEqual(body, { message: "Invalid user_id parameter" });
  assert.equal(state.events.length, 0);
});

test("POST /attendance is not allowed", async () => {
  const { handler } = loadHandler();

  const response = await handler(
    new Request("http://localhost/attendance", { method: "DELETE" }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 405);
  assert.deepEqual(body, { message: "Method Not Allowed" });
});

test("POST /attendance inserts when no existing row is found", async () => {
  const { handler, state } = loadHandler({
    listResult: { data: [], error: null },
    singleResult: {
      data: { id: 9, user_id: 10, state: 1 },
      error: null,
    },
  });

  const response = await handler(
    new Request("http://localhost/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: 10,
        work_start_dt: "2026-03-25 09:00:00",
        state: 1,
      }),
    }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 201);
  assert.deepEqual(body, { id: 9, user_id: 10, state: 1 });
  assert.deepEqual(toPlainJson(state.events[0]), {
    table: "attendance",
    inserted: null,
    updated: null,
    selected: "*",
    ordered: null,
    eq: { column: "user_id", value: 10 },
    mode: "list",
  });
  assert.equal(state.events[1].mode, "single");
  assert.equal(state.events[1].table, "attendance");
  assert.equal(state.events[1].inserted.user_id, 10);
  assert.equal(state.events[1].inserted.work_start_dt, "2026-03-25 09:00:00");
  assert.equal(state.events[1].inserted.work_end_dt, null);
  assert.equal(state.events[1].inserted.break_start_dt, null);
  assert.equal(state.events[1].inserted.break_end_dt, null);
  assert.equal(state.events[1].inserted.state, 1);
});

test("POST /attendance updates when a row already exists", async () => {
  const { handler, state } = loadHandler({
    listResult: {
      data: [{ id: 9, user_id: 10, state: 1 }],
      error: null,
    },
    singleResult: {
      data: { id: 9, user_id: 10, state: 2 },
      error: null,
    },
  });

  const response = await handler(
    new Request("http://localhost/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: 10,
        break_start_dt: "2026-03-25 12:00:00",
        state: 2,
      }),
    }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(body, { id: 9, user_id: 10, state: 2 });
  assert.equal(state.events[1].mode, "single");
  assert.equal(state.events[1].updated.user_id, 10);
  assert.equal(state.events[1].updated.work_start_dt, null);
  assert.equal(state.events[1].updated.work_end_dt, null);
  assert.equal(state.events[1].updated.break_start_dt, "2026-03-25 12:00:00");
  assert.equal(state.events[1].updated.break_end_dt, null);
  assert.equal(state.events[1].updated.state, 2);
  assert.deepEqual(toPlainJson(state.events[1].eq), {
    column: "user_id",
    value: 10,
  });
});

test("POST /attendance rejects invalid user_id", async () => {
  const { handler, state } = loadHandler();

  const response = await handler(
    new Request("http://localhost/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "abc" }),
    }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.deepEqual(body, { message: "Invalid user_id" });
  assert.equal(state.events.length, 0);
});

test("POST /attendance rejects invalid state", async () => {
  const { handler, state } = loadHandler();

  const response = await handler(
    new Request("http://localhost/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: 10, state: 9 }),
    }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.deepEqual(body, { message: "Invalid state" });
  assert.equal(state.events.length, 0);
});
