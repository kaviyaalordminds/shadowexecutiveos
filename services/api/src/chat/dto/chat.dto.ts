import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from "class-validator";

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

export class ScoreLeadDto {
  @IsString()
  @MinLength(1)
  companyName!: string;

  @IsString()
  @MinLength(1)
  sourceText!: string;
}

export class EvaluateInvestmentDto {
  @IsString()
  @MinLength(1)
  initiativeName!: string;

  @IsNumber()
  initialCost!: number;

  @IsOptional()
  @IsNumber()
  monthlyCost?: number;

  @IsOptional()
  @IsNumber()
  expectedMonthlyRevenue?: number;

  @IsOptional()
  @IsNumber()
  expectedMonthlySavings?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  horizonMonths?: number;
}
