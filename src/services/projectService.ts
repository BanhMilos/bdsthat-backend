import prisma from '../utils/prisma';

interface GetProjectsParams {
  page?: number;
  limit?: number;
  q?: string;
}

export const projectService = {
  async getProjects(params: GetProjectsParams) {
    const page = params.page || 0;
    const limit = params.limit || 100;
    const searchQuery = params.q || '';

    const where = searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' as const } },
            { description: { contains: searchQuery, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Investor: {
            select: {
              investorId: true,
              name: true,
              website: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      total,
      page,
      limit,
    };
  },

  async getProjectById(projectId: number) {
    const project = await prisma.project.findUnique({
      where: { projectId },
      include: {
        Investor: true,
        Property: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return project;
  },

  async getRelativeProjects(projectId: number) {
    // Get the project to find its investor
    const project = await prisma.project.findUnique({
      where: { projectId },
      select: { investorId: true },
    });

    if (!project) {
      return [];
    }

    // Get other projects from the same investor
    const relativeProjects = await prisma.project.findMany({
      where: {
        investorId: project.investorId,
        projectId: { not: projectId },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        Investor: {
          select: {
            investorId: true,
            name: true,
          },
        },
      },
    });

    return relativeProjects;
  },
};
