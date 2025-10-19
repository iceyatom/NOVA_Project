1. Prerequisites
Node.js 18+ with npm, yarn, or pnpm
MySQL 8.x installed and running locally
macOS: brew install mysql → brew services start mysql
Ubuntu: sudo apt-get install mysql-server
Windows: install via MySQL Installer and start the MySQL80 service
To verify MySQL is running:
mysqladmin ping -u root -p

2. Create the database and user

Log into MySQL:
mysql -u root -p

Then run:
CREATE DATABASE your_db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'app_password';
GRANT ALL PRIVILEGES ON your_db_name.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;

3. Create a .env file in the project root (or copy .env.example):
DATABASE_URL="mysql://app_user:app_password@localhost:3306/your_db_name"

4. Install and initialize Prisma
npm install -D prisma
npm install @prisma/client
npx prisma init

In prisma/schema.prisma, set:
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

5. Generate Prisma client

npx prisma generate

6. Create and apply migrations

npx prisma migrate dev --name init

7. (Optional) Seed data
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
then run:
npx prisma db seed

8. Verify the setup
9. 
Launch Prisma Studio to inspect your data:
npx prisma studio

Start your application:
npm run dev

9. Team setup instructions

From a fresh clone:

git clone <repo-url>
cd <repo-folder>
cp .env.example .env
npm install
# ensure MySQL is running
npx prisma generate
npx prisma migrate dev
npm run db:seed     # optional
npx prisma studio   # optional
npm run dev

   If the database or user doesn’t exist yet, create them following step 2.
