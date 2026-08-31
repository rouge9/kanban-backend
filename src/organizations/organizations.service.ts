import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
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
                    { name: 'TODO', order: 0, color: 'bg-blue-500' },
                    { name: 'IN PROGRESS', order: 1, color: 'bg-yellow-500' },
                    { name: 'DONE', order: 2, color: 'bg-green-500' },
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
      include: {
        members: true, // Include members so frontend can read the role
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
        members: true, // Include members so frontend can read the role
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

  async addMember(
    organizationId: string,
    adminUserId: string,
    addMemberDto: AddMemberDto,
  ) {
    // Check if requester is admin
    const requester = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: adminUserId },
      },
    });

    if (!requester || requester.role !== 'ADMIN') {
      throw new ForbiddenException('Only organization admins can add members');
    }

    // Find user by email
    const userToAdd = await this.prisma.user.findUnique({
      where: { email: addMemberDto.email },
    });

    if (!userToAdd) {
      throw new NotFoundException('User with this email not found');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: userToAdd.id },
      },
    });

    if (existingMember) {
      // If they already exist, we can just update their role or return as is
      return this.prisma.organizationMember.update({
        where: { id: existingMember.id },
        data: { role: addMemberDto.role || 'USER' },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    }

    return this.prisma.organizationMember.create({
      data: {
        organizationId,
        userId: userToAdd.id,
        role: addMemberDto.role || 'USER',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async removeMember(
    organizationId: string,
    adminUserId: string,
    targetUserId: string,
  ) {
    // Check if requester is admin
    const requester = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: adminUserId },
      },
    });

    if (!requester || requester.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only organization admins can remove members',
      );
    }

    if (adminUserId === targetUserId) {
      throw new ForbiddenException(
        'You cannot remove yourself from the organization',
      );
    }

    // Check if target is a member
    const targetMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in organization');
    }

    return this.prisma.organizationMember.delete({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
    });
  }

  async getMembers(organizationId: string, userId: string) {
    // Check if requester is a member
    const requester = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!requester) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
