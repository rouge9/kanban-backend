import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TeamsService', () => {
  let service: TeamsService;

  const mockPrismaService = {
    team: {
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
        TeamsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ForbiddenException if creating team without org access', async () => {
    mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ name: 'Team', organizationId: 'org-1' }, userId),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should create a team', async () => {
    const createDto = { name: 'Team', organizationId: 'org-1' };
    const resultTeam = { id: 'team-1', ...createDto };

    mockPrismaService.organizationMember.findUnique.mockResolvedValue({
      id: 'member-1',
    });
    mockPrismaService.team.create.mockResolvedValue(resultTeam);

    const result = await service.create(createDto, userId);
    expect(result).toEqual(resultTeam);
  });

  it('should find all teams', async () => {
    const teams = [{ id: 'team-1' }];
    mockPrismaService.team.findMany.mockResolvedValue(teams);
    const result = await service.findAll(userId);
    expect(result).toEqual(teams);
  });

  it('should throw NotFoundException on findOne if not found', async () => {
    mockPrismaService.team.findFirst.mockResolvedValue(null);
    await expect(service.findOne('team-1', userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should find one team', async () => {
    const team = { id: 'team-1' };
    mockPrismaService.team.findFirst.mockResolvedValue(team);
    const result = await service.findOne('team-1', userId);
    expect(result).toEqual(team);
  });

  it('should update a team', async () => {
    const team = { id: 'team-1' };
    const updateDto = { name: 'Updated' };
    mockPrismaService.team.findFirst.mockResolvedValue(team); // bypass access check
    mockPrismaService.team.update.mockResolvedValue({ ...team, ...updateDto });

    const result = await service.update('team-1', updateDto, userId);
    expect(result).toEqual({ ...team, ...updateDto });
  });

  it('should remove a team', async () => {
    const team = { id: 'team-1' };
    mockPrismaService.team.findFirst.mockResolvedValue(team); // bypass access check
    mockPrismaService.team.delete.mockResolvedValue(team);

    const result = await service.remove('team-1', userId);
    expect(result).toEqual(team);
  });
});
