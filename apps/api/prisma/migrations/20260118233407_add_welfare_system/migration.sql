/*
  Warnings:

  - The `status` column on the `guarantors` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `guarantorEmail` to the `guarantors` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GuarantorStatus" AS ENUM ('PENDING_ADMIN_CHECK', 'PENDING_FINANCE_APPROVAL', 'PENDING_GUARANTOR_ACTION', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WelfareType" AS ENUM ('BEREAVEMENT', 'SICKNESS', 'MATERNITY', 'EDUCATION', 'OTHER');

-- CreateEnum
CREATE TYPE "WelfareStatus" AS ENUM ('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "guarantors" DROP CONSTRAINT "guarantors_userId_fkey";

-- AlterTable
ALTER TABLE "guarantors" ADD COLUMN     "guarantorEmail" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "GuarantorStatus" NOT NULL DEFAULT 'PENDING_ADMIN_CHECK';

-- AlterTable
ALTER TABLE "loans" ADD COLUMN     "adminNotes" TEXT;

-- DropEnum
DROP TYPE "GuaranteeStatus";

-- CreateTable
CREATE TABLE "welfare_claims" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "WelfareType" NOT NULL,
    "description" TEXT NOT NULL,
    "documentUrl" TEXT,
    "amountRequested" DECIMAL(15,2) NOT NULL,
    "status" "WelfareStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "welfare_claims_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "guarantors" ADD CONSTRAINT "guarantors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "welfare_claims" ADD CONSTRAINT "welfare_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
