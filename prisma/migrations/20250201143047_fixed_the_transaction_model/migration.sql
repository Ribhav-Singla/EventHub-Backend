/*
  Warnings:

  - You are about to drop the column `attendee_type` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `payment_type` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `seat_category` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `ticket_count` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `TicketDetail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TicketDetail" DROP CONSTRAINT "TicketDetail_transactionId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "attendee_type",
DROP COLUMN "payment_type",
DROP COLUMN "seat_category",
DROP COLUMN "ticket_count";

-- DropTable
DROP TABLE "TicketDetail";

-- DropEnum
DROP TYPE "ATTENDEE";

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "ticket_quantity" INTEGER NOT NULL,
    "ticket_category" TEXT NOT NULL,
    "ticket_price" INTEGER NOT NULL,
    "payment_type" TEXT NOT NULL,
    "event_title" TEXT NOT NULL,
    "event_category" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "event_venue" TEXT NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendee" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,

    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendee" ADD CONSTRAINT "Attendee_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
