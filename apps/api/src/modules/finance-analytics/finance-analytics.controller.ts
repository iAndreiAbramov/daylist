import type { JwtUser } from '@modules/auth/strategies/jwt.strategy';
import {
  Controller,
  Get,
  Query,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@lib/decorators/current-user.decorator';
import { JwtAuthGuard } from '@lib/guards/jwt-auth.guard';
import { FinanceAnalyticsQueryReqDto } from './dto/req/finance-analytics-query-req.dto';
import { FinanceAnalyticsResDto } from './dto/res/finance-analytics-res.dto';
import { FinanceAnalyticsService } from './services/finance-analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('finance/analytics')
export class FinanceAnalyticsController {
  constructor(
    private readonly financeAnalyticsService: FinanceAnalyticsService,
  ) {}

  @Get()
  @SerializeOptions({ type: FinanceAnalyticsResDto })
  getAnalytics(
    @CurrentUser() user: JwtUser,
    @Query() query: FinanceAnalyticsQueryReqDto,
  ): Promise<FinanceAnalyticsResDto> {
    return this.financeAnalyticsService.getAnalytics(user.id, query);
  }
}
