@echo off
echo ================================================
echo Database Migration Script for CIDMS
echo ================================================

echo 1. Applying SQL migrations...
mysql -u root -p < migration-updates.sql

echo 2. Generating Prisma client...
cd ..
npx prisma db pull
npx prisma generate

echo 3. Migration completed successfully!
pause
