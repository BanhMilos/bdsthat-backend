import prisma from '../utils/prisma';

// Helpers to normalize IDs to numbers in API responses
const toNumberIfBigInt = (v: any) => (typeof v === 'bigint' ? Number(v) : v);
const mapArea = (a: any) =>
  a
    ? {
        ...a,
        areaId: toNumberIfBigInt(a.areaId),
        parentId: a.parentId !== null && a.parentId !== undefined ? toNumberIfBigInt(a.parentId) : a.parentId,
      }
    : a;
const mapFAQ = (f: any) =>
  f
    ? {
        ...f,
        faqId: toNumberIfBigInt(f.faqId),
        projectId: f.projectId !== null && f.projectId !== undefined ? toNumberIfBigInt(f.projectId) : f.projectId,
      }
    : f;
const mapConfig = (c: any) =>
  c
    ? {
        ...c,
        configId: toNumberIfBigInt(c.configId),
      }
    : c;

// Get provinces (top-level areas)
export const getProvinces = async (isOldArea?: boolean) => {
  const where: any = {
    type: 'PROVINCE',
  };

  if (isOldArea !== undefined) {
    where.isOldArea = isOldArea ? 1 : 0;
  }

  const provinces = await prisma.area.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return provinces.map(mapArea);
};

// Get sub-areas (districts and wards under a parent area)
export const getSubAreas = async (parentId: bigint, isOldArea?: boolean) => {
  const where: any = {
    parentId,
  };

  if (isOldArea !== undefined) {
    where.isOldArea = isOldArea ? 1 : 0;
  }

  const areas = await prisma.area.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return areas.map(mapArea);
};

// Get FAQs
export const getFAQs = async (filters: {
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters.page || 0;
  const limit = filters.limit || 100;
  const skip = page * limit;

  const where: any = {
    status: 'ACTIVE',
  };

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.q) {
    where.OR = [
      { question: { contains: filters.q, mode: 'insensitive' } },
      { answer: { contains: filters.q, mode: 'insensitive' } },
    ];
  }

  const [faqs, total] = await Promise.all([
    prisma.fAQ.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.fAQ.count({ where }),
  ]);

  return {
    faqs: faqs.map(mapFAQ),
    total,
    count: faqs.length,
    page,
    limit,
  };
};

// Get app configs
export const getConfigs = async () => {
  const configs = await prisma.config.findMany({
    where: {
      public: 1,
    },
  });

  // Transform configs into structured object
  const result: any = {};

  configs.forEach((config) => {
    try {
      // Try to parse value as JSON
      const parsedValue = JSON.parse(config.value);
      result[config.key] = parsedValue;
    } catch {
      // If not JSON, use raw value
      result[config.key] = config.value;
    }
  });

  return result;
};
