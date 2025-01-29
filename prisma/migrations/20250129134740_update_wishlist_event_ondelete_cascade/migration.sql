-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_eventId_fkey";

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
