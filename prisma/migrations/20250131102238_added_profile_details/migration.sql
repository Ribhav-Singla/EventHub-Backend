-- AlterTable
ALTER TABLE "User" ADD COLUMN     "Twitter" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "linkedIn" TEXT,
ADD COLUMN     "newsletter_subscription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT;
