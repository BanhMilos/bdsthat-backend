import prisma from '../utils/prisma';
import { News, Category } from '@prisma/client';

export class NewsService {
  /**
   * Get all news categories
   */
  static async getCategories(): Promise<Category[]> {
    return prisma.category.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all news with filters
   */
  static async getNews(filters: {
    categoryId?: string;
    orderBy?: string;
    q?: string;
    fromDate?: string;
    toDate?: string;
    tags?: string;
    page?: number;
    limit?: number;
  }): Promise<{ news: News[]; total: number; count: number }> {
    const page = filters.page || 0;
    const limit = filters.limit || 10;
    const skip = page * limit;

    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
    };

    // Filter by category IDs (comma-separated)
    if (filters.categoryId) {
      const categoryIds = filters.categoryId
        .split(',')
        .map((id) => BigInt(id.trim()))
        .filter((id) => !isNaN(id as any));
      if (categoryIds.length > 0) {
        where.categoryId = { in: categoryIds };
      }
    }

    // Filter by search query
    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { content: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    // Filter by date range
    if (filters.fromDate) {
      where.publishedDate = {
        ...where.publishedDate,
        gte: new Date(filters.fromDate),
      };
    }
    if (filters.toDate) {
      where.publishedDate = {
        ...where.publishedDate,
        lte: new Date(filters.toDate),
      };
    }

    // Filter by tags (comma-separated)
    if (filters.tags) {
      const tagList = filters.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      if (tagList.length > 0) {
        where.tags = {
          hasSome: tagList,
        };
      }
    }

    // Determine order by
    let orderBy: any = { createdAt: 'desc' };
    if (filters.orderBy === 'VIEWS') {
      orderBy = { views: 'desc' };
    } else if (filters.orderBy === 'RECENT') {
      orderBy = { publishedDate: 'desc' };
    }

    // Get total count
    const total = await prisma.news.count({ where });

    // Get news
    const news = await prisma.news.findMany({
      where,
      include: {
        Category: true,
        Project: true,
      },
      orderBy,
      skip,
      take: limit,
    });

    return {
      news,
      total,
      count: news.length,
    };
  }

  /**
   * Get news by ID with details
   */
  static async getNewsById(newsId: bigint): Promise<News | null> {
    const news = await prisma.news.findUnique({
      where: { newsId },
      include: {
        Category: true,
        Project: true,
      },
    });

    if (news) {
      // Increment views
      await prisma.news.update({
        where: { newsId },
        data: { views: { increment: 1 } },
      });
    }

    return news;
  }

  /**
   * Add comment to news
   */
  static async addComment(
    newsId: bigint,
    userId: bigint,
    content: string
  ): Promise<any> {
    const comment = await prisma.comment.create({
      data: {
        newsId,
        userId,
        content,
        status: 'PENDING',
      },
      include: {
        User: {
          select: {
            userId: true,
            fullname: true,
            avatar: true,
          },
        },
      },
    });

    return comment;
  }

  /**
   * Get related listings for a news
   */
  static async getRelatedListings(
    newsId: bigint,
    page: number = 0,
    limit: number = 10
  ): Promise<{ listings: any[]; total: number; count: number }> {
    const skip = page * limit;

    // Get the news to find its category and tags
    const news = await prisma.news.findUnique({
      where: { newsId },
      select: {
        categoryId: true,
        tags: true,
      },
    });

    if (!news) {
      return { listings: [], total: 0, count: 0 };
    }

    // Build where clause for related listings
    const where: any = {
      status: 'PUBLISHED',
    };

    // Get total count
    const total = await prisma.listing.count({ where });

    // Get listings
    const listings = await prisma.listing.findMany({
      where,
      include: {
        Property: true,
      },
      skip,
      take: limit,
    });

    return {
      listings,
      total,
      count: listings.length,
    };
  }
}
