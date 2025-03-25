/*
  Warnings:

  - You are about to drop the column `walkingPreferences` on the `Dog` table. All the data in the column will be lost.
  - Added the required column `address` to the `Dog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dog" DROP COLUMN "walkingPreferences",
ADD COLUMN     "address" JSONB NOT NULL;
