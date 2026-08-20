import { Test, TestingModule } from '@nestjs/testing';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';

describe('ColumnsController', () => {
  let controller: ColumnsController;
  let service: ColumnsService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'user',
    sessionId: 'session-1',
  };

  const mockColumnsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ColumnsController],
      providers: [
        {
          provide: ColumnsService,
          useValue: mockColumnsService,
        },
      ],
    }).compile();

    controller = module.get<ColumnsController>(ColumnsController);
    service = module.get<ColumnsService>(ColumnsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a column', async () => {
    const createDto = { name: 'Test Column', boardId: 'board-1' };
    mockColumnsService.create.mockResolvedValue({ id: 'col-1', ...createDto });
    const result = await controller.create(createDto, mockUser);
    expect(result).toEqual({ id: 'col-1', ...createDto });
    expect(jest.spyOn(service, 'create')).toHaveBeenCalledWith(
      createDto,
      mockUser.id,
    );
  });

  it('should find all columns', async () => {
    mockColumnsService.findAll.mockResolvedValue([{ id: 'col-1' }]);
    const result = await controller.findAll(mockUser);
    expect(result).toEqual([{ id: 'col-1' }]);
    expect(jest.spyOn(service, 'findAll')).toHaveBeenCalledWith(mockUser.id);
  });

  it('should find one column', async () => {
    mockColumnsService.findOne.mockResolvedValue({ id: 'col-1' });
    const result = await controller.findOne('col-1', mockUser);
    expect(result).toEqual({ id: 'col-1' });
    expect(jest.spyOn(service, 'findOne')).toHaveBeenCalledWith(
      'col-1',
      mockUser.id,
    );
  });

  it('should update a column', async () => {
    const updateDto = { name: 'Updated Column' };
    mockColumnsService.update.mockResolvedValue({ id: 'col-1', ...updateDto });
    const result = await controller.update('col-1', updateDto, mockUser);
    expect(result).toEqual({ id: 'col-1', ...updateDto });
    expect(jest.spyOn(service, 'update')).toHaveBeenCalledWith(
      'col-1',
      updateDto,
      mockUser.id,
    );
  });

  it('should remove a column', async () => {
    mockColumnsService.remove.mockResolvedValue({ id: 'col-1' });
    const result = await controller.remove('col-1', mockUser);
    expect(result).toEqual({ id: 'col-1' });
    expect(jest.spyOn(service, 'remove')).toHaveBeenCalledWith(
      'col-1',
      mockUser.id,
    );
  });
});
