# Status Page Application

A modern status page application for monitoring and reporting service status.

## Features

- Create and manage multiple organizations
- Track services and their status
- Create incidents and post updates
- Email notifications for subscribers
- Team management and access control

## Deployment

### Deploying to Vercel

1. Fork or clone this repository
2. Create a Neon PostgreSQL database at [neon.tech](https://neon.tech)
3. Deploy to Vercel
4. Set the following environment variables in Vercel:

```
# Database
DATABASE_URL=postgres://user:password@hostname-pooler.region.aws.neon.tech/dbname?sslmode=require

# Authentication
JWT_SECRET=your_secure_jwt_secret_key_here

# Mailtrap email settings
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your_mailtrap_user
EMAIL_PASSWORD=your_mailtrap_password
EMAIL_FROM="Status Page <notifications@example.com>"

# Application URL
NEXT_PUBLIC_APP_URL=https://your-app-url.vercel.app

# Disable demo mode
DEMO_MODE=false
```

5. Trigger a new deployment

### Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the variables from `.env.example`
4. Run the development server:
   ```
   npm run dev
   ```

## Database Schema

The application uses Prisma with PostgreSQL. The schema includes models for:
- User
- Organization
- Member
- Service
- Incident
- Update
- Subscription

## License

MIT License 