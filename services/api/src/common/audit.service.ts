import { Inject, Injectable, Logger } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../database/database.module";

export type AuditActorType = "user" | "agent" | "system";

/**
 * Real audit logging (spec section 46): every sensitive action (auth
 * events, agent tool executions) is written to audit_logs, not just
 * console-logged. Failures to write an audit row are logged but never
 * block the primary request — auditing must not become an outage vector.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger("AuditService");

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async record(params: {
    organizationId?: string | null;
    actorUserId?: string | null;
    actorType: AuditActorType;
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO audit_logs
          (organization_id, actor_user_id, actor_type, action, resource_type, resource_id, metadata, ip_address)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          params.organizationId ?? null,
          params.actorUserId ?? null,
          params.actorType,
          params.action,
          params.resourceType ?? null,
          params.resourceId ?? null,
          JSON.stringify(params.metadata ?? {}),
          params.ipAddress ?? null,
        ],
      );
    } catch (err) {
      this.logger.error(`Failed to write audit log for action=${params.action}`, err as Error);
    }
  }
}
