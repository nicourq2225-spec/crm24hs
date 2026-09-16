call npx prisma db push
call npx prisma generate
call node prisma/seed.js
call npm run dev
