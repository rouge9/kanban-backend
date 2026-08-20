import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

describe('TeamsController', () => {
  let controller: TeamsController;
  let service: TeamsService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'user',
    sessionId: 'session-1',
  };

  const mockTeamsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a team', async () => {
    const createDto = { name: 'Test Team', organizationId: 'org-1' };
    mockTeamsService.create.mockResolvedValue({ id: 'team-1', ...createDto });
    const result = await controller.create(createDto, mockUser);
    expect(result).toEqual({ id: 'team-1', ...createDto });
    expect(jest.spyOn(service, 'create')).toHaveBeenCalledWith(
      createDto,
      mockUser.id,
    );
  });

  it('should find all teams', async () => {
    mockTeamsService.findAll.mockResolvedValue([{ id: 'team-1' }]);
    const result = await controller.findAll(mockUser);
    expect(result).toEqual([{ id: 'team-1' }]);
    expect(jest.spyOn(service, 'findAll')).toHaveBeenCalledWith(mockUser.id);
  });

  it('should find one team', async () => {
    mockTeamsService.findOne.mockResolvedValue({ id: 'team-1' });
    const result = await controller.findOne('team-1', mockUser);
    expect(result).toEqual({ id: 'team-1' });
    expect(jest.spyOn(service, 'findOne')).toHaveBeenCalledWith(
      'team-1',
      mockUser.id,
    );
  });

  it('should update a team', async () => {
    const updateDto = { name: 'Updated Team' };
    mockTeamsService.update.mockResolvedValue({ id: 'team-1', ...updateDto });
    const result = await controller.update('team-1', updateDto, mockUser);
    expect(result).toEqual({ id: 'team-1', ...updateDto });
    expect(jest.spyOn(service, 'update')).toHaveBeenCalledWith(
      'team-1',
      updateDto,
      mockUser.id,
    );
  });

  it('should remove a team', async () => {
    mockTeamsService.remove.mockResolvedValue({ id: 'team-1' });
    const result = await controller.remove('team-1', mockUser);
    expect(result).toEqual({ id: 'team-1' });
    expect(jest.spyOn(service, 'remove')).toHaveBeenCalledWith(
      'team-1',
      mockUser.id,
    );
  });
});
