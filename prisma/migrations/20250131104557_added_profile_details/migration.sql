/*
  Warnings:

  - You are about to drop the column `Twitter` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "Twitter",
ADD COLUMN     "twitter" TEXT;
