/*
  Warnings:

  - You are about to drop the column `tickets_sold` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `total_tickets` on the `Event` table. All the data in the column will be lost.
  - Added the required column `general_ticket_price` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `general_tickets_count` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `general_tickets_sold` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vip_ticket_price` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vip_tickets_count` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vip_tickets_sold` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "tickets_sold",
DROP COLUMN "total_tickets",
ADD COLUMN     "general_ticket_price" INTEGER NOT NULL,
ADD COLUMN     "general_tickets_count" INTEGER NOT NULL,
ADD COLUMN     "general_tickets_sold" INTEGER NOT NULL,
ADD COLUMN     "vip_ticket_price" INTEGER NOT NULL,
ADD COLUMN     "vip_tickets_count" INTEGER NOT NULL,
ADD COLUMN     "vip_tickets_sold" INTEGER NOT NULL;
