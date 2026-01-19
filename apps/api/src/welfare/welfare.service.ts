import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { put } from '@vercel/blob';

// Fix for Missing Multer Type: Define a local interface or use any
interface UploadedFile {
  originalname: string;
  buffer: Buffer;
}

@Injectable()
export class WelfareService {
  constructor(private prisma: PrismaService) {}

  async createClaim(userId: string, data: any, file?: UploadedFile | any) {
    let documentUrl = null;

    if (file) {
      const { url } = await put(file.originalname, file.buffer, { 
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      documentUrl = url;
    }

    // Ensure 'npx prisma generate' has been run so welfareClaim exists
    return this.prisma.welfareClaim.create({
      data: {
        userId,
        type: data.type,
        description: data.description,
        amountRequested: Number(data.amount),
        documentUrl,
        status: 'PENDING',
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.welfareClaim.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.welfareClaim.findMany({
      include: {
        user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewClaim(id: string, status: 'PROCESSING' | 'APPROVED' | 'REJECTED', notes?: string) {
    return this.prisma.welfareClaim.update({
      where: { id },
      data: { status, adminNotes: notes },
    });
  }
}