declare module "jsr:@supabase/supabase-js@2" {
  export interface SupabaseError {
    message: string;
  }

  export interface QueryResult<T> {
    data: T[] | null;
    error: SupabaseError | null;
  }

  export interface QueryBuilder<T = unknown> {
    select(columns: string): QueryBuilder<T>;
    order(
      column: string,
      options?: { ascending?: boolean },
    ): Promise<QueryResult<T>>;
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
