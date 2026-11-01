import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { PaginatedResult, UserItem } from '@multi-site-cms/types';
import type { Request } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { type AssignRoleDto } from './dto/assign-role.dto';
import { type CreateUserDto } from './dto/create-user.dto';
import { type ListUsersQueryDto } from './dto/list-users-query.dto';
import { type UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('user:read')
  async list(@Query() query: ListUsersQueryDto): Promise<PaginatedResult<UserItem>> {
    return this.usersService.listUsers(query);
  }

  @Get(':id')
  @RequirePermissions('user:read')
  async getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<UserItem> {
    return this.usersService.getUserById(id);
  }

  @Post()
  @RequirePermissions('user:manage')
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() actorContext: EffectiveAuthContext,
    @Req() req: Request & { id?: string },
  ): Promise<UserItem> {
    return this.usersService.createUser(dto, actorContext, req.id);
  }

  @Patch(':id')
  @RequirePermissions('user:manage')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actorContext: EffectiveAuthContext,
    @Req() req: Request & { id?: string },
  ): Promise<UserItem> {
    return this.usersService.updateUser(id, dto, actorContext, req.id);
  }

  @Post(':id/roles')
  @RequirePermissions('role:assign')
  async assignRole(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() actorContext: EffectiveAuthContext,
    @Req() req: Request & { id?: string },
  ): Promise<UserItem> {
    return this.usersService.assignRole(id, dto, actorContext, req.id);
  }

  @Delete(':id/roles/:assignmentId')
  @RequirePermissions('role:assign')
  async revokeRole(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('assignmentId', new ParseUUIDPipe({ version: '4' })) assignmentId: string,
    @CurrentUser() actorContext: EffectiveAuthContext,
    @Req() req: Request & { id?: string },
  ): Promise<UserItem> {
    return this.usersService.revokeRole(id, assignmentId, actorContext, req.id);
  }
}
