/*
  Warnings:

  - Added the required column `event_category` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_date` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_time` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_title` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_venue` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "event_category" TEXT NOT NULL,
ADD COLUMN     "event_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "event_time" TEXT NOT NULL,
ADD COLUMN     "event_title" TEXT NOT NULL,
ADD COLUMN     "event_venue" TEXT NOT NULL;
