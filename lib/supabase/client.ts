// Stub Supabase client for compatibility during migration to Prisma
// This file provides the createClient function that existing code expects

export const createClient = () => {
  type QueryResult<T = unknown> = { data: T; error: unknown };
  type SelectChain = {
    eq: (_column: string, _value: unknown) => SelectChain;
    order: (_column: string, _opts?: { ascending?: boolean }) => SelectChain;
    limit: (_n: number) => SelectChain;
    maybeSingle: () => Promise<QueryResult>;
    single: () => Promise<QueryResult>;
  };

  // Return a mock client that provides the expected interface
  return {
    auth: {
      getUser: async () => {
        // Mock authentication - always return a mock user for now
        return {
          data: { user: { id: 'mock-user-id', email: 'mock@example.com' } },
          error: null
        };
      }
    },
    from: (_table: string) => {
      // Mock table query interface
      return {
        select: (_columns: string) => {
          const chain: SelectChain = {
            eq: (_column: string, _value: unknown) => chain,
            order: (_column: string, _opts?: { ascending?: boolean }) => chain,
            limit: (_n: number) => chain,
            maybeSingle: () => Promise.resolve({ data: {} as unknown, error: null as unknown }),
            single: () => Promise.resolve({ data: {} as unknown, error: null as unknown }),
          };
          return chain;
        },
        insert: (_rows: unknown[]) => {
          const chain = {
            select: (_cols?: string) => {
              const result = { data: [] as unknown[], error: null as unknown };
              const obj: {
                single: () => Promise<QueryResult>;
                then: (resolve: (v: typeof result) => unknown) => unknown;
              } = {
                single: () => Promise.resolve({ data: { id: 'mock-id' } as unknown, error: null as unknown }),
                then: (resolve: (v: typeof result) => unknown) => resolve(result),
              };
              return obj;
            },
            single: () => Promise.resolve({ data: { id: 'mock-id' } as unknown, error: null as unknown }),
          };
          return chain;
        },
        update: (_values: Record<string, unknown>) => {
          return {
            eq: (_column: string, _value: unknown) => ({
              select: (_cols?: string) => ({
                single: () => Promise.resolve({ data: {} as unknown, error: null as unknown }),
              }),
            }),
          };
        },
        delete: () => {
          return {
            eq: (_column: string, _value: unknown) => Promise.resolve({ data: [] as unknown[], error: null as unknown }),
          };
        },
      };
    }
  };
};
