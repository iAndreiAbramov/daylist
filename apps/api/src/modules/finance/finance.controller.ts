import type { JwtUser } from '@modules/auth/strategies/jwt.strategy';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@lib/decorators/current-user.decorator';
import { JwtAuthGuard } from '@lib/guards/jwt-auth.guard';
import { CreateFinanceEntryReqDto } from './dto/req/create-finance-entry-req.dto';
import { FilterFinanceEntriesReqDto } from './dto/req/filter-finance-entries-req.dto';
import { UpdateFinanceEntryReqDto } from './dto/req/update-finance-entry-req.dto';
import { FinanceEntryResDto } from './dto/res/finance-entry-res.dto';
import { FinanceService } from './services/finance.service';

@UseGuards(JwtAuthGuard)
@Controller('finance/entries')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get()
  @SerializeOptions({ type: FinanceEntryResDto })
  findAll(
    @CurrentUser() user: JwtUser,
    @Query() query: FilterFinanceEntriesReqDto,
  ): Promise<FinanceEntryResDto[]> {
    return this.financeService.findAll(user.id, query);
  }

  @Post()
  @SerializeOptions({ type: FinanceEntryResDto })
  create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateFinanceEntryReqDto,
  ): Promise<FinanceEntryResDto> {
    return this.financeService.create(user.id, dto);
  }

  @Patch(':id')
  @SerializeOptions({ type: FinanceEntryResDto })
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateFinanceEntryReqDto,
  ): Promise<FinanceEntryResDto> {
    return this.financeService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string): Promise<void> {
    return this.financeService.remove(user.id, id);
  }
}
