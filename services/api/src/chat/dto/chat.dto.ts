import { IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsString()
  agentKey!: string;
}
