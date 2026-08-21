import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AgentsService } from "./agents.service";

@Controller("agents")
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  list() {
    return this.agents.list();
  }
}
