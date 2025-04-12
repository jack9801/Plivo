# Status Page

A modern, real-time status page application built with Next.js, Prisma, and ShadcnUI.

## Features

- **User Authentication**: Secure login and registration system
- **Multi-tenant**: Support for multiple organizations
- **Team Management**: Invite and manage team members with different roles
- **Service Management**: CRUD operations for services and status updates
- **Incident Management**: Create, update, and resolve incidents
- **Real-time Updates**: WebSocket connections for instant status changes
- **Public Status Page**: Beautiful public-facing status page
- **Modern UI**: Clean, minimalistic design using ShadcnUI

## Technologies

- Next.js 14
- Prisma ORM
- PostgreSQL
- ShadcnUI (Radix UI + Tailwind CSS)
- Socket.io for real-time updates
- NextAuth.js for authentication

## Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/status-page.git
   cd status-page
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` to point to your PostgreSQL database

4. Generate Prisma client and run migrations:
   ```
   npx prisma generate
   npx prisma migrate dev
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Usage

### Dashboard

Access the admin dashboard at `/dashboard` to:
- Create and manage services
- Update service statuses
- Report and manage incidents
- Add team members
- Configure organization settings

### Public Status Page

The public status page is available at the root URL `/` and shows:
- Current status of all services
- Active incidents
- History of resolved incidents

## Deployment

### Preparing for Production

1. Build the application:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm start
   ```

### Windows-specific Deployment

For Windows users, a build script is provided to simplify the deployment process:

1. Run the build script:
   ```
   .\build.bat
   ```
   This script will:
   - Check for Node.js and npm
   - Create necessary configuration files
   - Install dependencies
   - Generate the Prisma client
   - Create environment files if they don't exist
   - Fix dependency version issues
   - Build the application

2. Start the production server on Windows:
   ```
   npm run start:win
   ```

### Docker Deployment

A Dockerfile is included for containerized deployment.

1. Build the Docker image:
   ```
   docker build -t status-page .
   ```

2. Run the container:
   ```
   docker run -p 3000:3000 status-page
   ```

## License

MIT 