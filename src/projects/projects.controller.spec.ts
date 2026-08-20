import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'user',
    sessionId: 'session-1',
  };

  const mockProjectsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a project', async () => {
    const createDto = { name: 'Test Project', organizationId: 'org-1' };
    mockProjectsService.create.mockResolvedValue({
      id: 'proj-1',
      ...createDto,
    });
    const result = await controller.create(createDto, mockUser);
    expect(result).toEqual({ id: 'proj-1', ...createDto });
    expect(jest.spyOn(service, 'create')).toHaveBeenCalledWith(
      createDto,
      mockUser.id,
    );
  });

  it('should find all projects', async () => {
    mockProjectsService.findAll.mockResolvedValue([{ id: 'proj-1' }]);
    const result = await controller.findAll(mockUser);
    expect(result).toEqual([{ id: 'proj-1' }]);
    expect(jest.spyOn(service, 'findAll')).toHaveBeenCalledWith(mockUser.id);
  });

  it('should find one project', async () => {
    mockProjectsService.findOne.mockResolvedValue({ id: 'proj-1' });
    const result = await controller.findOne('proj-1', mockUser);
    expect(result).toEqual({ id: 'proj-1' });
    expect(jest.spyOn(service, 'findOne')).toHaveBeenCalledWith(
      'proj-1',
      mockUser.id,
    );
  });

  it('should update a project', async () => {
    const updateDto = { name: 'Updated Project' };
    mockProjectsService.update.mockResolvedValue({
      id: 'proj-1',
      ...updateDto,
    });
    const result = await controller.update('proj-1', updateDto, mockUser);
    expect(result).toEqual({ id: 'proj-1', ...updateDto });
    expect(jest.spyOn(service, 'update')).toHaveBeenCalledWith(
      'proj-1',
      updateDto,
      mockUser.id,
    );
  });

  it('should remove a project', async () => {
    mockProjectsService.remove.mockResolvedValue({ id: 'proj-1' });
    const result = await controller.remove('proj-1', mockUser);
    expect(result).toEqual({ id: 'proj-1' });
    expect(jest.spyOn(service, 'remove')).toHaveBeenCalledWith(
      'proj-1',
      mockUser.id,
    );
  });
});
