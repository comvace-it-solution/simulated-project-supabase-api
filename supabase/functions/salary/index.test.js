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

test("GET /salary returns ordered list", async () => {
  const { handler, state } = loadHandler({
    listResult: {
      data: [{ id: 1, user_id: 10, hourly_wage: 1500 }],
      error: null,
    },
  });

  const response = await handler(new Request("http://localhost/salary"));
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(body, [{ id: 1, user_id: 10, hourly_wage: 1500 }]);
  assert.deepEqual(toPlainJson(state.events[0]), {
    table: "salary",
    selected: "*",
    ordered: { column: "id", options: { ascending: true } },
    eq: null,
    mode: "list",
  });
});

test("GET /salary?user_id=123 filters by user_id", async () => {
  const { handler, state } = loadHandler();

  const response = await handler(new Request("http://localhost/salary?user_id=123"));

  assert.equal(response.status, 200);
  assert.deepEqual(toPlainJson(state.events[0]), {
    table: "salary",
    selected: "*",
    ordered: { column: "id", options: { ascending: true } },
    eq: { column: "user_id", value: 123 },
    mode: "list",
  });
});

test("GET /salary returns empty array when no records exist", async () => {
  const { handler } = loadHandler({
    listResult: { data: [], error: null },
  });

  const response = await handler(new Request("http://localhost/salary"));
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(body, []);
});

test("GET /salary rejects invalid user_id", async () => {
  const { handler, state } = loadHandler();

  const response = await handler(new Request("http://localhost/salary?user_id=abc"));
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.deepEqual(body, { message: "Invalid user_id parameter" });
  assert.equal(state.events.length, 0);
});

test("POST /salary is not allowed", async () => {
  const { handler } = loadHandler();

  const response = await handler(
    new Request("http://localhost/salary", { method: "POST" }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 405);
  assert.deepEqual(body, { message: "Method Not Allowed" });
});
