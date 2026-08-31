import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.organizationsService.create(createOrganizationDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations the user is a member of' })
  findAll(@CurrentUser() user: JwtUser) {
    return this.organizationsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific organization' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.organizationsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization details (Admin only)' })
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organization (Admin only)' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.organizationsService.remove(id, user.id);
  }

  @Post(':id/members')
  @ApiOperation({
    summary: 'Add or invite a member to the organization (Admin only)',
  })
  addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.organizationsService.addMember(id, user.id, addMemberDto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List all members in the organization' })
  getMembers(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.organizationsService.getMembers(id, user.id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({
    summary: 'Remove a member from the organization (Admin only)',
  })
  removeMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.organizationsService.removeMember(id, user.id, targetUserId);
  }
}
