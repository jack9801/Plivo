# Prisma Database Configuration

This directory contains the Prisma schema and database migration files.

## Schema

The `schema.prisma` file defines the database models:

- `User` - Application users
- `Organization` - Organizations that own services
- `Member` - User membership in organizations with roles
- `Service` - Services that can have incidents
- `Incident` - Service incidents with status and severity
- `Update` - Updates to incidents
- `Subscription` - Email subscriptions to organization incidents

## Environment Setup

For production with Neon PostgreSQL on Vercel:

1. Create a Neon Database
2. Add the DATABASE_URL environment variable to Vercel:
   ```
   DATABASE_URL=postgres://user:password@hostname-pooler.region.aws.neon.tech/dbname?sslmode=require
   ```

## Migrations

When schema changes are made:

1. Update `schema.prisma`
2. Generate migrations:
   ```
   npx prisma migrate dev --name <migration-name>
   ```
3. Apply migrations in production:
   ```
   npx prisma migrate deploy
   ```

## Database Setup in Vercel

The application uses the following flow for database setup in Vercel:

1. `vercel-prisma-setup.js` runs during build to generate the Prisma client
2. The schema is applied to the database on first run
3. In development mode, the database is automatically migrated 