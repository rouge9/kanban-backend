import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto, userId: string) {
    return this.prisma.organization.create({
      data: {
        ...createOrganizationDto,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
        teams: {
          create: {
            name: 'General',
            members: {
              create: {
                userId,
              },
            },
          },
        },
        projects: {
          create: {
            name: 'First Project',
            members: {
              create: {
                userId,
              },
            },
            boards: {
              create: {
                name: 'Main Board',
                columns: {
                  create: [
                    { name: 'TODO', order: 0 },
                    { name: 'IN PROGRESS', order: 1 },
                    { name: 'DONE', order: 2 },
                  ],
                },
              },
            },
          },
        },
      },
    });
  }

  findAll(userId: string) {
    // Only return orgs the user is a member of
    return this.prisma.organization.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: {
        id,
        members: { some: { userId } },
      },
      include: {
        teams: true,
        projects: true,
      },
    });
    if (!org)
      throw new NotFoundException(
        `Organization #${id} not found or access denied`,
      );
    return org;
  }

  async update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto,
    userId: string,
  ) {
    // Check if user is an admin of this org
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: id, userId } },
    });
    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update the organization');
    }

    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
    });
  }

  async remove(id: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: id, userId } },
    });
    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete the organization');
    }

    return this.prisma.organization.delete({
      where: { id },
    });
  }
}
