import prisma from '../utils/prisma';

export interface UploadMediaInput {
  userId: bigint;
  files: Express.Multer.File[];
  propertyId?: bigint;
  projectId?: bigint;
  buildingId?: bigint;
  subdivisionId?: bigint;
  type: 'IMAGE' | 'VIDEO' | 'PANORAMA' | '3D';
}

export const uploadMedia = async (input: UploadMediaInput) => {
  const mediaRecords = await Promise.all(
    input.files.map(async (file, index) => {
      return prisma.media.create({
        data: {
          userId: input.userId,
          propertyId: input.propertyId,
          projectId: input.projectId,
          buildingId: input.buildingId,
          subdivisionId: input.subdivisionId,
          type: input.type as any,
          url: `/uploads/${file.filename}`,
          path: file.path,
          order: index,
        },
      });
    })
  );

  return mediaRecords;
};

export const getMediaById = async (mediaId: bigint) => {
  const media = await prisma.media.findUnique({
    where: { mediaId: mediaId },
  });

  return media;
};

export const updateMedia = async (mediaId: bigint, userId: bigint, data: {
  order?: number;
  type?: string;
}) => {
  const media = await prisma.media.findUnique({
    where: { mediaId: mediaId },
  });

  if (!media) {
    throw new Error('Media not found');
  }

  if (media.userId !== userId) {
    throw new Error('Not authorized to update this media');
  }

  const updated = await prisma.media.update({
    where: { mediaId: mediaId },
    data: {
      order: data.order,
      type: data.type as any,
    },
  });

  return updated;
};

export const deleteMedia = async (mediaId: bigint, userId: bigint) => {
  const media = await prisma.media.findUnique({
    where: { mediaId: mediaId },
  });

  if (!media) {
    throw new Error('Media not found');
  }

  if (media.userId !== userId) {
    throw new Error('Not authorized to delete this media');
  }

  // TODO: Delete physical file from filesystem
  // fs.unlinkSync(media.path);

  await prisma.media.delete({
    where: { mediaId: mediaId },
  });

  return { message: 'Media deleted successfully' };
};

export const deleteMultipleMedia = async (mediaIds: bigint[], userId: bigint) => {
  // Verify ownership of all media
  const media = await prisma.media.findMany({
    where: {
      mediaId: { in: mediaIds },
    },
  });

  const unauthorized = media.some(m => m.userId !== userId);
  if (unauthorized) {
    throw new Error('Not authorized to delete one or more media files');
  }

  // TODO: Delete physical files
  // media.forEach(m => fs.unlinkSync(m.path));

  await prisma.media.deleteMany({
    where: {
      mediaId: { in: mediaIds },
    },
  });

  return { message: `${media.length} media files deleted successfully` };
};
