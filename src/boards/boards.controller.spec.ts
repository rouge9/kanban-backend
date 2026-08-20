import { Test, TestingModule } from '@nestjs/testing';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';

describe('BoardsController', () => {
  let controller: BoardsController;
  let service: BoardsService;
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'user',
    sessionId: 'session-1',
  };

  const mockBoardsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardsController],
      providers: [
        {
          provide: BoardsService,
          useValue: mockBoardsService,
        },
      ],
    }).compile();

    controller = module.get<BoardsController>(BoardsController);
    service = module.get<BoardsService>(BoardsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a board', async () => {
    const createDto = { name: 'Test Board', projectId: 'proj-1' };
    mockBoardsService.create.mockResolvedValue({ id: 'board-1', ...createDto });
    const result = await controller.create(createDto, mockUser);
    expect(result).toEqual({ id: 'board-1', ...createDto });
    expect(jest.spyOn(service, 'create')).toHaveBeenCalledWith(
      createDto,
      mockUser.id,
    );
  });

  it('should find all boards', async () => {
    mockBoardsService.findAll.mockResolvedValue([{ id: 'board-1' }]);
    const result = await controller.findAll(mockUser);
    expect(result).toEqual([{ id: 'board-1' }]);
    expect(jest.spyOn(service, 'findAll')).toHaveBeenCalledWith(mockUser.id);
  });

  it('should find one board', async () => {
    mockBoardsService.findOne.mockResolvedValue({ id: 'board-1' });
    const result = await controller.findOne('board-1', mockUser);
    expect(result).toEqual({ id: 'board-1' });
    expect(jest.spyOn(service, 'findOne')).toHaveBeenCalledWith(
      'board-1',
      mockUser.id,
    );
  });

  it('should update a board', async () => {
    const updateDto = { name: 'Updated Board' };
    mockBoardsService.update.mockResolvedValue({ id: 'board-1', ...updateDto });
    const result = await controller.update('board-1', updateDto, mockUser);
    expect(result).toEqual({ id: 'board-1', ...updateDto });
    expect(jest.spyOn(service, 'update')).toHaveBeenCalledWith(
      'board-1',
      updateDto,
      mockUser.id,
    );
  });

  it('should remove a board', async () => {
    mockBoardsService.remove.mockResolvedValue({ id: 'board-1' });
    const result = await controller.remove('board-1', mockUser);
    expect(result).toEqual({ id: 'board-1' });
    expect(jest.spyOn(service, 'remove')).toHaveBeenCalledWith(
      'board-1',
      mockUser.id,
    );
  });
});
