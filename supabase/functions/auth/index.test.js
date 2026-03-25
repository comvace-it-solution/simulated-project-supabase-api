const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadHandler(options = {}) {
  const files = ["shared.ts", "get.ts", "index.ts"];
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
  };

  function makeQueryBuilder(table) {
    const event = {
      table,
      selected: null,
      ordered: null,
      eq: null,
      mode: null,
    };

    return {
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

test("GET /auth returns ordered list", async () => {
  const { handler, state } = loadHandler({
    listResult: { data: [{ user_id: 1 }], error: null },
  });

  const response = await handler(new Request("http://localhost/auth"));
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(body, [{ user_id: 1 }]);
  assert.deepEqual(toPlainJson(state.events[0]), {
    table: "auth",
    selected: "*",
    ordered: { column: "user_id", options: { ascending: true } },
    eq: null,
    mode: "list",
  });
});

test("GET /auth?userId=123 filters by user_id", async () => {
  const { handler, state } = loadHandler();

  const response = await handler(new Request("http://localhost/auth?userId=123"));

  assert.equal(response.status, 200);
  assert.deepEqual(toPlainJson(state.events[0]), {
    table: "auth",
    selected: "*",
    ordered: { column: "user_id", options: { ascending: true } },
    eq: { column: "user_id", value: 123 },
    mode: "list",
  });
});

test("GET /auth rejects invalid userId", async () => {
  const { handler, state } = loadHandler();

  const response = await handler(new Request("http://localhost/auth?userId=abc"));
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.deepEqual(body, { message: "Invalid userId parameter" });
  assert.equal(state.events.length, 0);
});

test("POST /auth is not allowed", async () => {
  const { handler } = loadHandler();

  const response = await handler(
    new Request("http://localhost/auth", { method: "POST" }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 405);
  assert.deepEqual(body, { message: "Method Not Allowed" });
});
