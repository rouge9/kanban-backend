import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ColumnsService {
  constructor(private prisma: PrismaService) {}

  async checkBoardAccess(boardId: string, userId: string) {
    const board = await this.prisma.board.findFirst({
      where: {
        id: boardId,
        project: {
          organization: {
            members: { some: { userId } }
          }
        }
      }
    });
    if (!board) throw new ForbiddenException('Access denied to this board');
    return board;
  }

  async create(createColumnDto: CreateColumnDto, userId: string) {
    await this.checkBoardAccess(createColumnDto.boardId, userId);

    if (createColumnDto.order === undefined) {
       const maxCol = await this.prisma.column.findFirst({
         where: { boardId: createColumnDto.boardId },
         orderBy: { order: 'desc' },
       });
       createColumnDto.order = maxCol ? maxCol.order + 1 : 0;
    }

    return this.prisma.column.create({
      data: createColumnDto,
    });
  }

  findAll(userId: string) {
    return this.prisma.column.findMany({
      where: {
        board: {
          project: {
            organization: {
              members: { some: { userId } }
            }
          }
        }
      }
    });
  }

  async findOne(id: string, userId: string) {
    const column = await this.prisma.column.findFirst({
      where: { 
        id,
        board: {
          project: {
            organization: {
              members: { some: { userId } }
            }
          }
        }
      },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      }
    });
    if (!column) throw new NotFoundException(`Column #${id} not found or access denied`);
    return column;
  }

  async update(id: string, updateColumnDto: UpdateColumnDto, userId: string) {
    const column = await this.findOne(id, userId);
    return this.prisma.column.update({
      where: { id: column.id },
      data: updateColumnDto,
    });
  }

  async remove(id: string, userId: string) {
    const column = await this.findOne(id, userId);
    return this.prisma.column.delete({
      where: { id: column.id },
    });
  }
}
