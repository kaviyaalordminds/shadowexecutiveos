import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../database/database.module";

@Injectable()
export class AgentsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list() {
    const result = await this.pool.query(
      `SELECT id, agent_key, name, role, description, status, autonomy_level,
              model_provider, model_name, allowed_tools
       FROM agents ORDER BY name`,
    );
    return result.rows;
  }

  async getByKey(agentKey: string) {
    const result = await this.pool.query(`SELECT * FROM agents WHERE agent_key = $1`, [
      agentKey,
    ]);
    if (result.rowCount === 0) {
      throw new NotFoundException(`Unknown agent '${agentKey}'`);
    }
    return result.rows[0];
  }
}
