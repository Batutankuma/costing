// Stub Supabase server client for compatibility during migration to Prisma
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
          const result = { data: [] as unknown[], error: null as unknown };
          const chain: {
            eq: (_column: string, _value: unknown) => typeof chain;
            select: (_cols?: string) => { single: () => Promise<QueryResult> };
            then: (resolve: (v: typeof result) => unknown) => unknown;
          } = {
            eq: (_column: string, _value: unknown) => chain,
            select: (_cols?: string) => ({
              single: () => Promise.resolve({ data: {} as unknown, error: null as unknown }),
            }),
            then: (resolve: (v: typeof result) => unknown) => resolve(result),
          };
          return chain;
        },
        delete: () => {
          const result = { data: [] as unknown[], error: null as unknown };
          const chain: {
            eq: (column: string, value: unknown) => typeof chain;
            then: (resolve: (v: typeof result) => unknown) => Promise<unknown>;
          } = {
            eq: (_column: string, _value: unknown) => chain,
            then: (resolve: (v: typeof result) => unknown) => Promise.resolve(resolve(result)),
          };
          return chain;
        },
      };
    },
    storage: {
      listBuckets: async () => {
        // Mock storage buckets list
        return {
          data: [
            { id: 'mock-bucket-id', name: 'delivery-documents', public: true }
          ],
          error: null
        };
      },
      createBucket: async (bucketName: string, options?: Record<string, unknown>) => {
        // Mock bucket creation
        return {
          data: { id: 'mock-bucket-id', name: bucketName, public: options?.public || false },
          error: null
        };
      },
      from: (bucketName: string) => {
        // Mock storage bucket interface
        return {
          upload: async (
            path: string,
            _file: Blob | ArrayBuffer | Uint8Array | Buffer | File,
            _options?: Record<string, unknown>
          ): Promise<{
            data: { path: string; fullPath: string };
            error: { message: string } | null;
          }> => {
            // Mock file upload
            return {
              data: { path, fullPath: `${bucketName}/${path}` },
              error: null,
            };
          },
          getPublicUrl: (path: string) => {
            // Mock public URL generation
            return {
              data: { publicUrl: `https://mock-storage.supabase.co/storage/v1/object/public/${bucketName}/${path}` }
            };
          },
          remove: async (paths: string[]) => {
            // Mock file removal
            return {
              data: paths.map(path => ({ name: path })),
              error: null
            };
          }
        };
      }
    }
  };
};
