import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'user',
    sessionId: 'session-1',
  };

  const mockOrganizationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
      ],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an organization', async () => {
    const createDto = { name: 'Test Org' };
    mockOrganizationsService.create.mockResolvedValue({
      id: 'org-1',
      ...createDto,
    });
    const result = await controller.create(createDto, mockUser);
    expect(result).toEqual({ id: 'org-1', ...createDto });
    expect(mockOrganizationsService.create).toHaveBeenCalledWith(
      createDto,
      mockUser.id,
    );
  });

  it('should find all organizations', async () => {
    mockOrganizationsService.findAll.mockResolvedValue([{ id: 'org-1' }]);
    const result = await controller.findAll(mockUser);
    expect(result).toEqual([{ id: 'org-1' }]);
    expect(mockOrganizationsService.findAll).toHaveBeenCalledWith(mockUser.id);
  });

  it('should find one organization', async () => {
    mockOrganizationsService.findOne.mockResolvedValue({ id: 'org-1' });
    const result = await controller.findOne('org-1', mockUser);
    expect(result).toEqual({ id: 'org-1' });
    expect(mockOrganizationsService.findOne).toHaveBeenCalledWith(
      'org-1',
      mockUser.id,
    );
  });

  it('should update an organization', async () => {
    const updateDto = { name: 'Updated Org' };
    mockOrganizationsService.update.mockResolvedValue({
      id: 'org-1',
      ...updateDto,
    });
    const result = await controller.update('org-1', updateDto, mockUser);
    expect(result).toEqual({ id: 'org-1', ...updateDto });
    expect(mockOrganizationsService.update).toHaveBeenCalledWith(
      'org-1',
      updateDto,
      mockUser.id,
    );
  });

  it('should remove an organization', async () => {
    mockOrganizationsService.remove.mockResolvedValue({ id: 'org-1' });
    const result = await controller.remove('org-1', mockUser);
    expect(result).toEqual({ id: 'org-1' });
    expect(mockOrganizationsService.remove).toHaveBeenCalledWith(
      'org-1',
      mockUser.id,
    );
  });
});
