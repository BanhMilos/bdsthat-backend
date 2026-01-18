import prisma from '../utils/prisma';

export interface UploadDocumentInput {
  userId: bigint;
  file: Express.Multer.File;
  propertyId?: bigint;
  projectId?: bigint;
  title: string;
  description?: string;
  type?: 'PDF' | 'DOCX' | 'IMAGE' | 'OTHER';
  legalType?: 'SO_HONG' | 'HDMB' | 'OTHER';
}

export const uploadDocument = async (input: UploadDocumentInput) => {
  const document = await prisma.document.create({
    data: {
      userId: input.userId,
      propertyId: input.propertyId,
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      url: `/uploads/${input.file.filename}`,
      path: input.file.path,
      type: input.type as any,
      legalType: input.legalType as any,
    },
  });

  return document;
};

export const getDocumentById = async (documentId: bigint) => {
  const document = await prisma.document.findUnique({
    where: { documentId: documentId },
    include: {
      User: {
        select: {
          userId: true,
          fullname: true,
        },
      },
      Property: {
        select: {
          propertyId: true,
          title: true,
        },
      },
      Project: {
        select: {
          projectId: true,
          name: true,
        },
      },
    },
  });

  return document;
};

export const updateDocument = async (documentId: bigint, userId: bigint, data: {
  title?: string;
  description?: string;
  type?: string;
  legalType?: string;
}) => {
  const document = await prisma.document.findUnique({
    where: { documentId: documentId },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  if (document.userId !== userId) {
    throw new Error('Not authorized to update this document');
  }

  const updated = await prisma.document.update({
    where: { documentId: documentId },
    data: {
      title: data.title,
      description: data.description,
      type: data.type as any,
      legalType: data.legalType as any,
    },
  });

  return updated;
};

export const deleteDocument = async (documentId: bigint) => {
  const document = await prisma.document.findUnique({
    where: { documentId: documentId },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  // TODO: Delete physical file
  // fs.unlinkSync(document.path);

  await prisma.document.delete({
    where: { documentId: documentId },
  });

  return { message: 'Document deleted successfully' };
};
