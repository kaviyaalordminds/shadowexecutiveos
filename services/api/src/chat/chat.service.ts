import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import { PG_POOL } from "../database/database.module";
import { AuditService } from "../common/audit.service";
import { AgentsService } from "../agents/agents.service";
import { JwtPayload } from "../auth/jwt.strategy";
import { SendMessageDto } from "./dto/chat.dto";

/**
 * Chat orchestration: persists the user's message, forwards the full
 * conversation history to the Python AI service's per-agent endpoint,
 * persists the assistant's reply (plus any tool calls it made), and
 * audit-logs the tool executions. This is the Node-gateway half of the
 * "Node API -> Python AI Service -> agent" pipeline in section 3.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger("ChatService");
  private readonly aiServiceUrl: string;
  private readonly internalToken: string;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly agents: AgentsService,
    private readonly audit: AuditService,
    config: ConfigService,
  ) {
    this.aiServiceUrl = config.get<string>("AI_SERVICE_URL", "http://localhost:8000");
    this.internalToken = config.get<string>(
      "AI_SERVICE_INTERNAL_TOKEN",
      "change_me_internal_token",
    );
  }

  async sendMessage(user: JwtPayload, dto: SendMessageDto) {
    const agent = await this.agents.getByKey(dto.agentKey);

    const conversationId = await this.resolveConversation(user, agent.id, dto.conversationId);

    await this.pool.query(
      `INSERT INTO messages (conversation_id, role, content) VALUES ($1,'user',$2)`,
      [conversationId, dto.content],
    );

    const history = await this.pool.query(
      `SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId],
    );

    const aiResponse = await this.callAgentService(dto.agentKey, {
      organization_id: user.organizationId,
      user_id: user.sub,
      conversation_id: conversationId,
      messages: history.rows.map((r) => ({ role: r.role, content: r.content })),
    });

    await this.pool.query(
      `INSERT INTO messages (conversation_id, role, content, tool_calls, token_usage)
       VALUES ($1,'assistant',$2,$3,$4)`,
      [
        conversationId,
        aiResponse.content,
        JSON.stringify(aiResponse.tool_calls ?? []),
        JSON.stringify(aiResponse.token_usage ?? null),
      ],
    );

    for (const call of aiResponse.tool_calls ?? []) {
      await this.audit.record({
        organizationId: user.organizationId,
        actorUserId: user.sub,
        actorType: "agent",
        action: "agent.tool_call",
        resourceType: "tool",
        metadata: { agentKey: dto.agentKey, tool: call.tool_name, input: call.input },
      });
    }

    return {
      conversationId,
      agentKey: dto.agentKey,
      content: aiResponse.content,
      toolCalls: aiResponse.tool_calls ?? [],
      model: aiResponse.model,
      provider: aiResponse.provider,
    };
  }

  async listConversationMessages(user: JwtPayload, conversationId: string) {
    const owned = await this.pool.query(
      `SELECT id FROM conversations WHERE id = $1 AND user_id = $2 AND organization_id = $3`,
      [conversationId, user.sub, user.organizationId],
    );
    if (owned.rowCount === 0) {
      return [];
    }
    const messages = await this.pool.query(
      `SELECT id, role, content, tool_calls, created_at
       FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId],
    );
    return messages.rows;
  }

  private async resolveConversation(
    user: JwtPayload,
    agentId: string,
    conversationId?: string,
  ): Promise<string> {
    if (conversationId) {
      const existing = await this.pool.query(
        `SELECT id FROM conversations WHERE id = $1 AND user_id = $2`,
        [conversationId, user.sub],
      );
      if ((existing.rowCount ?? 0) > 0) {
        return conversationId;
      }
    }
    const created = await this.pool.query(
      `INSERT INTO conversations (organization_id, user_id, agent_id, title)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [user.organizationId, user.sub, agentId, "New conversation"],
    );
    return created.rows[0].id;
  }

  private async callAgentService(agentKey: string, payload: unknown): Promise<any> {
    const url = `${this.aiServiceUrl}/internal/v1/agents/${agentKey}/chat`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": this.internalToken,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`AI service returned ${res.status}: ${text}`);
        throw new BadGatewayException("The AI service could not process this request.");
      }
      return await res.json();
    } catch (err) {
      this.logger.error(`Failed to reach AI service at ${url}`, err as Error);
      throw new BadGatewayException("The AI service is currently unavailable.");
    }
  }
}
