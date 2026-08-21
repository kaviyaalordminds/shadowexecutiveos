import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { ChatModule } from "./chat/chat.module";
import { AgentsModule } from "./agents/agents.module";
import { AuditModule } from "./common/audit.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuditModule,
    AuthModule,
    AgentsModule,
    ChatModule,
  ],
})
export class AppModule {}
