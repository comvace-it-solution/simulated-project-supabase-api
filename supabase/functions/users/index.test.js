const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadHandler(options = {}) {
  let source = fs.readFileSync(__dirname + "/index.ts", "utf8");
  source = source
    .replace(/^\/\/\/.*\n/gm, "")
    .replace(/^import .*\n/gm, "")
    .replace(/!;/g, ";")
    .replace("function corsHeaders(origin: string | null) {", "function corsHeaders(origin) {")
    .replace("async (req: Request) => {", "async (req) => {");

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
    Date,
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

test("GET /users returns ordered list", async () => {
  const { handler, state } = loadHandler({
    listResult: { data: [{ id: 1 }], error: null },
  });

  const response = await handler(new Request("http://localhost/users"));
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(body, [{ id: 1 }]);
  assert.deepEqual(toPlainJson(state.events[0]), {
    table: "user",
    inserted: null,
    selected: "*",
    ordered: { column: "id", options: { ascending: true } },
    eq: null,
    mode: "list",
  });
});

test("GET /users?id=123 filters by id", async () => {
  const { handler, state } = loadHandler();

  const response = await handler(new Request("http://localhost/users?id=123"));

  assert.equal(response.status, 200);
  assert.deepEqual(toPlainJson(state.events[0]), {
    table: "user",
    inserted: null,
    selected: "*",
    ordered: { column: "id", options: { ascending: true } },
    eq: { column: "id", value: 123 },
    mode: "list",
  });
});

test("GET /users rejects invalid id", async () => {
  const { handler, state } = loadHandler();

  const response = await handler(new Request("http://localhost/users?id=abc"));
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.deepEqual(body, { message: "Invalid id parameter" });
  assert.equal(state.events.length, 0);
});

test("POST /users rejects invalid JSON", async () => {
  const { handler, state } = loadHandler();

  const response = await handler(
    new Request("http://localhost/users", { method: "POST", body: "{" }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.deepEqual(body, { message: "Invalid JSON body" });
  assert.equal(state.events.length, 0);
});

test("POST /users validates required fields", async () => {
  const { handler } = loadHandler();

  const response = await handler(
    new Request("http://localhost/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: "Alice" }),
    }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.deepEqual(body, { message: "email is required" });
});

test("POST /users inserts trimmed payload", async () => {
  const { handler, state } = loadHandler({
    singleResult: {
      data: { id: 99, user_name: "Alice", email: "alice@example.com" },
      error: null,
    },
  });

  const response = await handler(
    new Request("http://localhost/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_name: " Alice ",
        email: " alice@example.com ",
        phone_number: "090-1234-5678",
        address_1: "Tokyo",
        birthdate: "2000-01-02",
      }),
    }),
  );
  const body = await readJson(response);
  const event = state.events[0];

  assert.equal(response.status, 201);
  assert.deepEqual(body, {
    id: 99,
    user_name: "Alice",
    email: "alice@example.com",
  });
  assert.equal(event.table, "user");
  assert.equal(event.mode, "single");
  assert.equal(event.inserted.user_name, "Alice");
  assert.equal(event.inserted.email, "alice@example.com");
  assert.equal(event.inserted.phone_number, "090-1234-5678");
  assert.equal(event.inserted.post_number, null);
  assert.equal(event.inserted.address_1, "Tokyo");
  assert.equal(event.inserted.address_2, null);
  assert.equal(event.inserted.address_3, null);
  assert.equal(event.inserted.birthdate, "2000-01-02");
  assert.match(event.inserted.created_at, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(event.inserted.created_at, event.inserted.update_at);
});

test("POST /users returns 500 on database error", async () => {
  const { handler } = loadHandler({
    singleResult: {
      data: null,
      error: { message: "duplicate key value violates unique constraint" },
    },
  });

  const response = await handler(
    new Request("http://localhost/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: "Bob", email: "bob@example.com" }),
    }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 500);
  assert.deepEqual(body, {
    message: "duplicate key value violates unique constraint",
  });
});
