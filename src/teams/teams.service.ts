import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async checkOrgAccess(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!member)
      throw new ForbiddenException('Access denied to this organization');
    return member;
  }

  async create(createTeamDto: CreateTeamDto, userId: string) {
    await this.checkOrgAccess(createTeamDto.organizationId, userId);
    return this.prisma.team.create({
      data: {
        ...createTeamDto,
        members: {
          create: { userId },
        },
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.team.findMany({
      where: {
        organization: {
          members: { some: { userId } },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const team = await this.prisma.team.findFirst({
      where: {
        id,
        organization: {
          members: { some: { userId } },
        },
      },
      include: {
        projects: true,
      },
    });
    if (!team)
      throw new NotFoundException(`Team #${id} not found or access denied`);
    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, userId: string) {
    const team = await this.findOne(id, userId); // verifies access
    return this.prisma.team.update({
      where: { id: team.id },
      data: updateTeamDto,
    });
  }

  async remove(id: string, userId: string) {
    const team = await this.findOne(id, userId); // verifies access
    return this.prisma.team.delete({
      where: { id: team.id },
    });
  }
}
