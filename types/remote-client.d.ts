type FetchLike = (
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string | Blob | Buffer | FormData;
  }
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<any>;
  text(): Promise<string>;
}>;

declare class RemoteD1Statement {
  constructor(client: RemoteClient, sql: string);
  bind(...args: any[]): this;
  all(): Promise<any>;
  run(): Promise<any>;
}

interface RemoteClientOptions {
  accountId: string;
  databaseId: string;
  apiToken: string;
  fetch?: FetchLike;
}

declare class RemoteClient {
  endpoint: string;
  headers: Record<string, string>;
  fetch: FetchLike;

  constructor(options: RemoteClientOptions);
  prepare(sql: string): RemoteD1Statement;
}

export = RemoteClient;
