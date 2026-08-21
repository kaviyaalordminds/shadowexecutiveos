import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Pool } from "pg";

export const PG_POOL = "PG_POOL";

/**
 * Global Postgres connection pool. Every query in the API gateway goes
 * through this pool with parameterized SQL — no string-concatenated
 * queries anywhere in the codebase (SQL-injection safety).
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Pool({
          connectionString: config.get<string>(
            "DATABASE_URL",
            "postgresql://shadow:shadow_dev_password@localhost:5433/shadow_os",
          ),
        });
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
