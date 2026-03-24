declare module "jsr:@supabase/supabase-js@2" {
  export interface SupabaseError {
    message: string;
  }

  export interface QueryResult<T> {
    data: T[] | null;
    error: SupabaseError | null;
  }

  export interface SingleQueryResult<T> {
    data: T | null;
    error: SupabaseError | null;
  }

  export interface QueryBuilder<T = unknown> extends PromiseLike<QueryResult<T>> {
    select(columns: string): QueryBuilder<T>;
    insert(values: Partial<T> | Array<Partial<T>>): QueryBuilder<T>;
    update(values: Partial<T>): QueryBuilder<T>;
    delete(): QueryBuilder<T>;
    eq(column: string, value: unknown): QueryBuilder<T>;
    order(
      column: string,
      options?: { ascending?: boolean },
    ): QueryBuilder<T>;
    single(): Promise<SingleQueryResult<T>>;
  }

  export interface SupabaseClient {
    from<T = unknown>(table: string): QueryBuilder<T>;
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: {
      auth?: {
        persistSession?: boolean;
      };
    },
  ): SupabaseClient;
}

declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }

  function serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void;

  const env: Env;
}
