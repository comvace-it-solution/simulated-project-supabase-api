declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }

  function serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void;

  const env: Env;
}
