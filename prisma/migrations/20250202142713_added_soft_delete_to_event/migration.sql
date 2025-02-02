/*
  Warnings:

  - You are about to drop the column `event_category` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `event_date` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `event_time` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `event_title` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `event_venue` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "event_category",
DROP COLUMN "event_date",
DROP COLUMN "event_time",
DROP COLUMN "event_title",
DROP COLUMN "event_venue";
