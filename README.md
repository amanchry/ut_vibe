UT Vibe — a real-time, map-based campus feed for sharing spontaneous events,
gatherings, and useful moments. Built with Next.js, Radix UI, MongoDB, and
Cloudinary.

Setup
- npm install
- Create a .env file with:
  - DATABASE_URL="mongodb+srv://user:pass@cluster/dbname"
  - NEXTAUTH_SECRET="super-secret"
  - NEXTAUTH_URL="http://localhost:3000"
  - CLOUDINARY_CLOUD_NAME="xxx"
  - CLOUDINARY_API_KEY="xxx"
  - CLOUDINARY_API_SECRET="xxx"
- npx prisma generate
-    npx prisma db push
- npm run dev (or npm run build)

