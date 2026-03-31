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
import { CreateCategoryReqDto } from './dto/req/create-category-req.dto';
import { FilterCategoriesReqDto } from './dto/req/filter-categories-req.dto';
import { UpdateCategoryReqDto } from './dto/req/update-category-req.dto';
import { CategoryResDto } from './dto/res/category-res.dto';
import { CategoriesService } from './services/categories.service';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @SerializeOptions({ type: CategoryResDto })
  findAll(
    @CurrentUser() user: JwtUser,
    @Query() query: FilterCategoriesReqDto,
  ): Promise<CategoryResDto[]> {
    return this.categoriesService.findAll(user.id, query.type);
  }

  @Post()
  @SerializeOptions({ type: CategoryResDto })
  create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateCategoryReqDto,
  ): Promise<CategoryResDto> {
    return this.categoriesService.create(user.id, dto);
  }

  @Patch(':id')
  @SerializeOptions({ type: CategoryResDto })
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryReqDto,
  ): Promise<CategoryResDto> {
    return this.categoriesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string): Promise<void> {
    return this.categoriesService.remove(user.id, id);
  }
}
