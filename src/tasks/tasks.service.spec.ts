import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;

  const mockTx = {
    task: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    column: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: typeof mockTx) => unknown) =>
      callback(mockTx),
    ),
  };

  const userId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ForbiddenException if creating task without column access', async () => {
    mockPrismaService.column.findFirst.mockResolvedValue(null);
    await expect(
      service.create({ title: 'Task', columnId: 'col-1' }, userId),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should create a task', async () => {
    const createDto = { title: 'Task', columnId: 'col-1', order: 0 };
    const resultTask = { id: 'task-1', ...createDto };

    mockPrismaService.column.findFirst.mockResolvedValue({ id: 'col-1' });
    mockPrismaService.task.create.mockResolvedValue(resultTask);

    const result = await service.create(createDto, userId);
    expect(result).toEqual(resultTask);
  });

  it('should find all tasks', async () => {
    const tasks = [{ id: 'task-1' }];
    mockPrismaService.task.findMany.mockResolvedValue(tasks);
    const result = await service.findAll(userId);
    expect(result).toEqual(tasks);
  });

  it('should find one task', async () => {
    const task = { id: 'task-1' };
    mockPrismaService.task.findFirst.mockResolvedValue(task);
    const result = await service.findOne('task-1', userId);
    expect(result).toEqual(task);
  });

  it('should update a task', async () => {
    const task = { id: 'task-1' };
    const updateDto = { title: 'Updated' };
    mockPrismaService.task.findFirst.mockResolvedValue(task);
    mockPrismaService.task.update.mockResolvedValue({ ...task, ...updateDto });

    const result = await service.update('task-1', updateDto, userId);
    expect(result).toEqual({ ...task, ...updateDto });
  });

  it('should remove a task', async () => {
    const task = { id: 'task-1' };
    mockPrismaService.task.findFirst.mockResolvedValue(task);
    mockPrismaService.task.delete.mockResolvedValue(task);

    const result = await service.remove('task-1', userId);
    expect(result).toEqual(task);
  });

  it('should move a task within same column', async () => {
    const task = { id: 'task-1', columnId: 'col-1', order: 0 };
    mockPrismaService.task.findFirst.mockResolvedValue(task);
    mockPrismaService.column.findFirst.mockResolvedValue({ id: 'col-1' });

    const updatedTask = { ...task, order: 2 };
    mockTx.task.update.mockResolvedValue(updatedTask);

    const result = await service.moveTask('task-1', 'col-1', 2, userId);

    expect(mockTx.task.updateMany).toHaveBeenCalled();
    expect(mockTx.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { columnId: 'col-1', order: 2 },
    });
    expect(result).toEqual(updatedTask);
  });
});
