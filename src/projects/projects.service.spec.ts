import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockPrismaService = {
    project: {
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
        ProjectsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ForbiddenException if creating project without org access', async () => {
    mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ name: 'Project', organizationId: 'org-1' }, userId),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should create a project', async () => {
    const createDto = { name: 'Project', organizationId: 'org-1' };
    const resultProj = { id: 'proj-1', ...createDto };

    mockPrismaService.organizationMember.findUnique.mockResolvedValue({
      id: 'member-1',
    });
    mockPrismaService.project.create.mockResolvedValue(resultProj);

    const result = await service.create(createDto, userId);
    expect(result).toEqual(resultProj);
  });

  it('should find all projects', async () => {
    const projects = [{ id: 'proj-1' }];
    mockPrismaService.project.findMany.mockResolvedValue(projects);
    const result = await service.findAll(userId);
    expect(result).toEqual(projects);
  });

  it('should find one project', async () => {
    const project = { id: 'proj-1' };
    mockPrismaService.project.findFirst.mockResolvedValue(project);
    const result = await service.findOne('proj-1', userId);
    expect(result).toEqual(project);
  });

  it('should update a project', async () => {
    const project = { id: 'proj-1' };
    const updateDto = { name: 'Updated' };
    mockPrismaService.project.findFirst.mockResolvedValue(project);
    mockPrismaService.project.update.mockResolvedValue({
      ...project,
      ...updateDto,
    });

    const result = await service.update('proj-1', updateDto, userId);
    expect(result).toEqual({ ...project, ...updateDto });
  });

  it('should remove a project', async () => {
    const project = { id: 'proj-1' };
    mockPrismaService.project.findFirst.mockResolvedValue(project);
    mockPrismaService.project.delete.mockResolvedValue(project);

    const result = await service.remove('proj-1', userId);
    expect(result).toEqual(project);
  });
});
