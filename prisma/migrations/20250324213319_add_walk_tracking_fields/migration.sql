-- AlterTable
ALTER TABLE "Walk" ADD COLUMN     "dropoffLocation" JSONB,
ADD COLUMN     "isTrackingActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupLocation" JSONB,
ADD COLUMN     "routeCoordinates" JSONB,
ADD COLUMN     "walkEndLocation" JSONB,
ADD COLUMN     "walkStartLocation" JSONB;
