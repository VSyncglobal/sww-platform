-- CreateEnum
CREATE TYPE "ExecutionMode" AS ENUM ('AUTOMATIC', 'MANUAL');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "executionMode" "ExecutionMode" NOT NULL DEFAULT 'AUTOMATIC';
