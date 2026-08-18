import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from 'src/auth/interfaces/jwt-user.interface';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserEntity })
  getMe(@CurrentUser() user: JwtUser) {
    return this.usersService.findOne(user.id);
  }

  @Get('me/sessions')
  @ApiOperation({ summary: 'Get all active sessions for current user' })
  getSessions(@CurrentUser() user: JwtUser) {
    return this.usersService.getUserSessions(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  update(@CurrentUser() user: JwtUser, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  // @Delete('me')
  // @ApiOperation({ summary: 'Delete current user account' })
  // remove(@CurrentUser() user: JwtUser) {
  //   return this.usersService.remove(user.id);
  // }
}
