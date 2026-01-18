import prisma from '../utils/prisma';

interface GetInvestorsParams {
  page?: number;
  limit?: number;
  q?: string;
}

export const investorService = {
  async getInvestors(params: GetInvestorsParams) {
    const page = params.page || 0;
    const limit = params.limit || 100;
    const searchQuery = params.q || '';

    const where = searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' as const } },
            { description: { contains: searchQuery, mode: 'insensitive' as const } },
            { address: { contains: searchQuery, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [investors, total] = await Promise.all([
      prisma.investor.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.investor.count({ where }),
    ]);

    return {
      investors,
      total,
      page,
      limit,
    };
  },

  async getInvestorById(investorId: number) {
    const investor = await prisma.investor.findUnique({
      where: { investorId },
      include: {
        Project: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return investor;
  },
};
