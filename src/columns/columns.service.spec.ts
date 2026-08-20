import { Test, TestingModule } from '@nestjs/testing';
import { ColumnsService } from './columns.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('ColumnsService', () => {
  let service: ColumnsService;

  const mockPrismaService = {
    column: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    board: {
      findFirst: jest.fn(),
    },
  };

  const userId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColumnsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ColumnsService>(ColumnsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ForbiddenException if creating column without board access', async () => {
    mockPrismaService.board.findFirst.mockResolvedValue(null);
    await expect(
      service.create({ name: 'Column', boardId: 'board-1' }, userId),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should create a column', async () => {
    const createDto = { name: 'Column', boardId: 'board-1', order: 0 };
    const resultCol = { id: 'col-1', ...createDto };

    mockPrismaService.board.findFirst.mockResolvedValue({ id: 'board-1' });
    mockPrismaService.column.create.mockResolvedValue(resultCol);

    const result = await service.create(createDto, userId);
    expect(result).toEqual(resultCol);
  });

  it('should find all columns', async () => {
    const columns = [{ id: 'col-1' }];
    mockPrismaService.column.findMany.mockResolvedValue(columns);
    const result = await service.findAll(userId);
    expect(result).toEqual(columns);
  });

  it('should find one column', async () => {
    const column = { id: 'col-1' };
    mockPrismaService.column.findFirst.mockResolvedValue(column);
    const result = await service.findOne('col-1', userId);
    expect(result).toEqual(column);
  });

  it('should update a column', async () => {
    const column = { id: 'col-1' };
    const updateDto = { name: 'Updated' };
    mockPrismaService.column.findFirst.mockResolvedValue(column);
    mockPrismaService.column.update.mockResolvedValue({
      ...column,
      ...updateDto,
    });

    const result = await service.update('col-1', updateDto, userId);
    expect(result).toEqual({ ...column, ...updateDto });
  });

  it('should remove a column', async () => {
    const column = { id: 'col-1' };
    mockPrismaService.column.findFirst.mockResolvedValue(column);
    mockPrismaService.column.delete.mockResolvedValue(column);

    const result = await service.remove('col-1', userId);
    expect(result).toEqual(column);
  });
});
