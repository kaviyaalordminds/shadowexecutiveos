import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtPayload } from "../auth/jwt.strategy";
import { ChatService } from "./chat.service";
import { EvaluateInvestmentDto, ScoreLeadDto, SendMessageDto } from "./dto/chat.dto";

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

  // Deterministic tool endpoints — work without a live LLM call, see
  // ChatService.scoreLead/evaluateInvestment.
  @Post("tools/score-lead")
  scoreLead(@CurrentUser() user: JwtPayload, @Body() dto: ScoreLeadDto) {
    return this.chat.scoreLead(user, dto);
  }

  @Post("tools/evaluate-investment")
  evaluateInvestment(@CurrentUser() user: JwtPayload, @Body() dto: EvaluateInvestmentDto) {
    return this.chat.evaluateInvestment(user, dto);
  }

  @Get("leads")
  leads(@CurrentUser() user: JwtPayload) {
    return this.chat.listLeads(user);
  }
}
