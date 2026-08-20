import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async checkColumnAccess(columnId: string, userId: string) {
    const column = await this.prisma.column.findFirst({
      where: {
        id: columnId,
        board: {
          project: {
            organization: {
              members: { some: { userId } },
            },
          },
        },
      },
    });
    if (!column) throw new ForbiddenException('Access denied to this column');
    return column;
  }

  async create(createTaskDto: CreateTaskDto, userId: string) {
    await this.checkColumnAccess(createTaskDto.columnId, userId);

    if (createTaskDto.order === undefined) {
      const maxTask = await this.prisma.task.findFirst({
        where: { columnId: createTaskDto.columnId },
        orderBy: { order: 'desc' },
      });
      createTaskDto.order = maxTask ? maxTask.order + 1 : 0;
    }

    return this.prisma.task.create({
      data: createTaskDto,
    });
  }

  findAll(userId: string) {
    return this.prisma.task.findMany({
      where: {
        column: {
          board: {
            project: {
              organization: {
                members: { some: { userId } },
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        column: {
          board: {
            project: {
              organization: {
                members: { some: { userId } },
              },
            },
          },
        },
      },
    });
    if (!task)
      throw new NotFoundException(`Task #${id} not found or access denied`);
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.findOne(id, userId);
    return this.prisma.task.update({
      where: { id: task.id },
      data: updateTaskDto,
    });
  }

  async remove(id: string, userId: string) {
    const task = await this.findOne(id, userId);
    return this.prisma.task.delete({
      where: { id: task.id },
    });
  }

  async moveTask(
    taskId: string,
    targetColumnId: string,
    newOrder: number,
    userId: string,
  ) {
    const task = await this.findOne(taskId, userId);
    await this.checkColumnAccess(targetColumnId, userId);

    return this.prisma.$transaction(async (tx) => {
      const oldColumnId = task.columnId;
      const oldOrder = task.order;

      if (oldColumnId === targetColumnId) {
        if (oldOrder === newOrder) return task;

        if (oldOrder < newOrder) {
          await tx.task.updateMany({
            where: {
              columnId: targetColumnId,
              order: { gt: oldOrder, lte: newOrder },
              id: { not: taskId },
            },
            data: { order: { decrement: 1 } },
          });
        } else {
          await tx.task.updateMany({
            where: {
              columnId: targetColumnId,
              order: { gte: newOrder, lt: oldOrder },
              id: { not: taskId },
            },
            data: { order: { increment: 1 } },
          });
        }
      } else {
        await tx.task.updateMany({
          where: { columnId: oldColumnId, order: { gt: oldOrder } },
          data: { order: { decrement: 1 } },
        });

        await tx.task.updateMany({
          where: { columnId: targetColumnId, order: { gte: newOrder } },
          data: { order: { increment: 1 } },
        });
      }

      return tx.task.update({
        where: { id: taskId },
        data: {
          columnId: targetColumnId,
          order: newOrder,
        },
      });
    });
  }
}
