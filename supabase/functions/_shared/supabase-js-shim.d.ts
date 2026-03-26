declare module "jsr:@supabase/supabase-js@2" {
  export type SupabaseClientOptions = {
    auth?: {
      persistSession?: boolean;
      autoRefreshToken?: boolean;
    };
  };

  export type SupabaseError = {
    message: string;
    code?: string;
  };

  export type QueryResult<T> = Promise<{
    data: T | null;
    error: SupabaseError | null;
  }>;

  export type QueryArrayResult<T> = Promise<{
    data: T[] | null;
    error: SupabaseError | null;
  }>;

  export interface SupabaseQueryBuilder {
    select(columns: string): SupabaseQueryBuilder;
    insert(values: Record<string, unknown>): SupabaseQueryBuilder;
    update(values: Record<string, unknown>): SupabaseQueryBuilder;
    delete(): SupabaseQueryBuilder;
    eq(column: string, value: string | number | boolean | null): SupabaseQueryBuilder;
    is(column: string, value: string | number | boolean | null): SupabaseQueryBuilder;
    gte(column: string, value: string): SupabaseQueryBuilder;
    lt(column: string, value: string): SupabaseQueryBuilder;
    in(column: string, values: Array<string | number>): SupabaseQueryBuilder;
    order(column: string, options?: { ascending?: boolean }): SupabaseQueryBuilder;
    maybeSingle<T>(): QueryResult<T>;
    single<T>(): QueryResult<T>;
    then<TResult1 = {
      data: unknown[] | null;
      error: SupabaseError | null;
    }, TResult2 = never>(
      onfulfilled?:
        | ((value: { data: unknown[] | null; error: SupabaseError | null }) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2>;
  }

  export interface SupabaseClient {
    from(table: string): SupabaseQueryBuilder;
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions,
  ): SupabaseClient;
}
