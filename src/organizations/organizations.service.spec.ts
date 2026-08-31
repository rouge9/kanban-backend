import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  const mockPrismaService = {
    organization: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organizationMember: {
      findUnique: jest.fn(),
    },
  };

  const userId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an organization', async () => {
    const createDto = { name: 'Test Org' };
    const resultOrg = { id: 'org-1', name: 'Test Org' };

    mockPrismaService.organization.create.mockResolvedValue(resultOrg);

    const result = await service.create(createDto, userId);
    expect(result).toEqual(resultOrg);
    expect(mockPrismaService.organization.create).toHaveBeenCalledWith({
      data: {
        ...createDto,
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
  });

  it('should find all organizations for a user', async () => {
    const orgs = [{ id: 'org-1' }];
    mockPrismaService.organization.findMany.mockResolvedValue(orgs);

    const result = await service.findAll(userId);
    expect(result).toEqual(orgs);
    expect(mockPrismaService.organization.findMany).toHaveBeenCalledWith({
      where: { members: { some: { userId } } },
      include: { members: true },
    });
  });

  it('should throw NotFoundException if organization not found or access denied', async () => {
    mockPrismaService.organization.findFirst.mockResolvedValue(null);
    await expect(service.findOne('org-1', userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should find one organization', async () => {
    const org = { id: 'org-1', teams: [], projects: [] };
    mockPrismaService.organization.findFirst.mockResolvedValue(org);

    const result = await service.findOne('org-1', userId);
    expect(result).toEqual(org);
  });

  it('should throw ForbiddenException if updating without ADMIN role', async () => {
    mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);
    await expect(
      service.update('org-1', { name: 'New' }, userId),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should update organization if ADMIN', async () => {
    const updateDto = { name: 'Updated' };
    const org = { id: 'org-1', name: 'Updated' };
    mockPrismaService.organizationMember.findUnique.mockResolvedValue({
      role: 'ADMIN',
    });
    mockPrismaService.organization.update.mockResolvedValue(org);

    const result = await service.update('org-1', updateDto, userId);
    expect(result).toEqual(org);
  });

  it('should remove organization if ADMIN', async () => {
    const org = { id: 'org-1' };
    mockPrismaService.organizationMember.findUnique.mockResolvedValue({
      role: 'ADMIN',
    });
    mockPrismaService.organization.delete.mockResolvedValue(org);

    const result = await service.remove('org-1', userId);
    expect(result).toEqual(org);
  });
});
