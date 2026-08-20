import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async checkProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organization: {
          members: { some: { userId } },
        },
      },
    });
    if (!project) throw new ForbiddenException('Access denied to this project');
    return project;
  }

  async create(createBoardDto: CreateBoardDto, userId: string) {
    await this.checkProjectAccess(createBoardDto.projectId, userId);
    return this.prisma.board.create({
      data: createBoardDto,
    });
  }

  findAll(userId: string) {
    return this.prisma.board.findMany({
      where: {
        project: {
          organization: {
            members: { some: { userId } },
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const board = await this.prisma.board.findFirst({
      where: {
        id,
        project: {
          organization: {
            members: { some: { userId } },
          },
        },
      },
      include: {
        columns: {
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!board)
      throw new NotFoundException(`Board #${id} not found or access denied`);
    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto, userId: string) {
    const board = await this.findOne(id, userId);
    return this.prisma.board.update({
      where: { id: board.id },
      data: updateBoardDto,
    });
  }

  async remove(id: string, userId: string) {
    const board = await this.findOne(id, userId);
    return this.prisma.board.delete({
      where: { id: board.id },
    });
  }
}
