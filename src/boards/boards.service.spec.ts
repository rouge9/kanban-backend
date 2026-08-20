import { Test, TestingModule } from '@nestjs/testing';
import { BoardsService } from './boards.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('BoardsService', () => {
  let service: BoardsService;

  const mockPrismaService = {
    board: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
  };

  const userId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ForbiddenException if creating board without project access', async () => {
    mockPrismaService.project.findFirst.mockResolvedValue(null);
    await expect(
      service.create({ name: 'Board', projectId: 'proj-1' }, userId),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should create a board', async () => {
    const createDto = { name: 'Board', projectId: 'proj-1' };
    const resultBoard = { id: 'board-1', ...createDto };

    mockPrismaService.project.findFirst.mockResolvedValue({ id: 'proj-1' });
    mockPrismaService.board.create.mockResolvedValue(resultBoard);

    const result = await service.create(createDto, userId);
    expect(result).toEqual(resultBoard);
  });

  it('should find all boards', async () => {
    const boards = [{ id: 'board-1' }];
    mockPrismaService.board.findMany.mockResolvedValue(boards);
    const result = await service.findAll(userId);
    expect(result).toEqual(boards);
  });

  it('should find one board', async () => {
    const board = { id: 'board-1' };
    mockPrismaService.board.findFirst.mockResolvedValue(board);
    const result = await service.findOne('board-1', userId);
    expect(result).toEqual(board);
  });

  it('should update a board', async () => {
    const board = { id: 'board-1' };
    const updateDto = { name: 'Updated' };
    mockPrismaService.board.findFirst.mockResolvedValue(board);
    mockPrismaService.board.update.mockResolvedValue({
      ...board,
      ...updateDto,
    });

    const result = await service.update('board-1', updateDto, userId);
    expect(result).toEqual({ ...board, ...updateDto });
  });

  it('should remove a board', async () => {
    const board = { id: 'board-1' };
    mockPrismaService.board.findFirst.mockResolvedValue(board);
    mockPrismaService.board.delete.mockResolvedValue(board);

    const result = await service.remove('board-1', userId);
    expect(result).toEqual(board);
  });
});
