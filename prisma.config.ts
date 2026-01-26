import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    url: "postgres://postgres:root@localhost:5432/postgres?",
  },
});
