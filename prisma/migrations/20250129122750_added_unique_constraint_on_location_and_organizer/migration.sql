/*
  Warnings:

  - A unique constraint covering the columns `[eventId]` on the table `Location` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventId]` on the table `Organizer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TicketDetail" ALTER COLUMN "age" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "amount" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Location_eventId_key" ON "Location"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_eventId_key" ON "Organizer"("eventId");
