import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtPayload } from "../auth/jwt.strategy";
import { ChatService } from "./chat.service";
import { SendMessageDto } from "./dto/chat.dto";

@Controller("chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post("messages")
  send(@CurrentUser() user: JwtPayload, @Body() dto: SendMessageDto) {
    return this.chat.sendMessage(user, dto);
  }

  @Get("conversations/:id/messages")
  history(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.chat.listConversationMessages(user, id);
  }
}
