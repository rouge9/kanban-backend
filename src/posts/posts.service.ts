import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: number, dto: CreatePostDto) {
    const existingSlug = await this.prisma.post.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) throw new ForbiddenException('Slug already in use');

    return this.prisma.post.create({
      data: { ...dto, authorId },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  async findAll(query: QueryPostsDto) {
    const { published, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {};
    if (published !== undefined) where.published = published;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    if (!post) throw new NotFoundException(`Post '${slug}' not found`);

    this.prisma.post
      .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});

    return post;
  }

  async update(userId: number, postId: number, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');

    if (dto.slug && dto.slug !== post.slug) {
      const existing = await this.prisma.post.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) throw new ForbiddenException('Slug already in use');
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: dto,
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  async remove(userId: number, postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');

    await this.prisma.post.delete({ where: { id: postId } });
    return { message: 'Post deleted successfully' };
  }
}
