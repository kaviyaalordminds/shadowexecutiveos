import { Global, Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Pool } from "pg";

export const PG_POOL = "PG_POOL";

const logger = new Logger("PostgresPool");

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
        const pool = new Pool({
          connectionString: config.get<string>(
            "DATABASE_URL",
            "postgresql://shadow:shadow_dev_password@localhost:5433/shadow_os",
          ),
        });
        // pg emits 'error' on the pool whenever an *idle* client's
        // connection is dropped in the background (Postgres restarted,
        // network blip, connection idle-timeout, etc — not just "never
        // connected"). Node's EventEmitter contract makes an unhandled
        // 'error' event throw and crash the whole process, which would
        // silently kill the entire API gateway on any transient DB
        // hiccup and leave it dead (not just erroring) until manually
        // restarted. This listener is the documented pg fix.
        pool.on("error", (err) => {
          logger.error("Unexpected error on idle Postgres client", err.stack);
        });
        return pool;
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
