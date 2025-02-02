/*
  Warnings:

  - Changed the type of `event_date` on the `Ticket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "event_date",
ADD COLUMN     "event_date" TIMESTAMP(3) NOT NULL;
