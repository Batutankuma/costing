// Stub Supabase server client for compatibility during migration to Prisma
// This file provides the createClient function that existing code expects

export const createClient = () => {
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
          const chain: any = {
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
              const obj: any = {
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
          const chain: any = {
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
          const chain: any = {
            eq: (_column: string, _value: unknown) => chain,
            then: (resolve: (v: typeof result) => unknown) => resolve(result),
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
      createBucket: async (bucketName: string, options?: any) => {
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
            file: Blob | ArrayBuffer | Uint8Array | Buffer | File,
            options?: any
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
