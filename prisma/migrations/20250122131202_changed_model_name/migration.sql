/*
  Warnings:

  - You are about to drop the `OrganizerDetail` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `date` on the `Event` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "OrganizerDetail" DROP CONSTRAINT "OrganizerDetail_eventId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "OrganizerDetail";

-- CreateTable
CREATE TABLE "Organizer" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "Organizer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_eventId_key" ON "Organizer"("eventId");

-- AddForeignKey
ALTER TABLE "Organizer" ADD CONSTRAINT "Organizer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
