import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async checkOrgAccess(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!member)
      throw new ForbiddenException('Access denied to this organization');
    return member;
  }

  async create(createProjectDto: CreateProjectDto, userId: string) {
    await this.checkOrgAccess(createProjectDto.organizationId, userId);
    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        members: {
          create: { userId },
        },
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.project.findMany({
      where: {
        organization: {
          members: { some: { userId } },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        organization: {
          members: { some: { userId } },
        },
      },
      include: {
        boards: true,
      },
    });
    if (!project)
      throw new NotFoundException(`Project #${id} not found or access denied`);
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string) {
    const project = await this.findOne(id, userId);
    return this.prisma.project.update({
      where: { id: project.id },
      data: updateProjectDto,
    });
  }

  async remove(id: string, userId: string) {
    const project = await this.findOne(id, userId);
    return this.prisma.project.delete({
      where: { id: project.id },
    });
  }
}
