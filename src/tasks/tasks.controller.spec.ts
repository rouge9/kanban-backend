import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'user',
    sessionId: 'session-1',
  };

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    moveTask: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a task', async () => {
    const createDto = { title: 'Test Task', columnId: 'col-1' };
    mockTasksService.create.mockResolvedValue({ id: 'task-1', ...createDto });
    const result = await controller.create(createDto, mockUser);
    expect(result).toEqual({ id: 'task-1', ...createDto });
    expect(jest.spyOn(service, 'create')).toHaveBeenCalledWith(
      createDto,
      mockUser.id,
    );
  });

  it('should find all tasks', async () => {
    mockTasksService.findAll.mockResolvedValue([{ id: 'task-1' }]);
    const result = await controller.findAll(mockUser);
    expect(result).toEqual([{ id: 'task-1' }]);
    expect(jest.spyOn(service, 'findAll')).toHaveBeenCalledWith(mockUser.id);
  });

  it('should find one task', async () => {
    mockTasksService.findOne.mockResolvedValue({ id: 'task-1' });
    const result = await controller.findOne('task-1', mockUser);
    expect(result).toEqual({ id: 'task-1' });
    expect(jest.spyOn(service, 'findOne')).toHaveBeenCalledWith(
      'task-1',
      mockUser.id,
    );
  });

  it('should update a task', async () => {
    const updateDto = { title: 'Updated Task' };
    mockTasksService.update.mockResolvedValue({ id: 'task-1', ...updateDto });
    const result = await controller.update('task-1', updateDto, mockUser);
    expect(result).toEqual({ id: 'task-1', ...updateDto });
    expect(jest.spyOn(service, 'update')).toHaveBeenCalledWith(
      'task-1',
      updateDto,
      mockUser.id,
    );
  });

  it('should remove a task', async () => {
    mockTasksService.remove.mockResolvedValue({ id: 'task-1' });
    const result = await controller.remove('task-1', mockUser);
    expect(result).toEqual({ id: 'task-1' });
    expect(jest.spyOn(service, 'remove')).toHaveBeenCalledWith(
      'task-1',
      mockUser.id,
    );
  });

  it('should move a task', async () => {
    const moveDto = { columnId: 'col-2', newOrder: 5 };
    mockTasksService.moveTask.mockResolvedValue({ id: 'task-1', ...moveDto });
    const result = await controller.moveTask('task-1', moveDto, mockUser);
    expect(result).toEqual({ id: 'task-1', ...moveDto });
    expect(jest.spyOn(service, 'moveTask')).toHaveBeenCalledWith(
      'task-1',
      moveDto.columnId,
      moveDto.newOrder,
      mockUser.id,
    );
  });
});
