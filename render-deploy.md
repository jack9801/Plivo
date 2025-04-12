# Deploying Status Page on Render

This guide walks you through deploying the Status Page application on Render.

## Prerequisites

1. A [Render account](https://render.com)
2. Your code pushed to GitHub
3. A PostgreSQL database (you can use Render's managed PostgreSQL service)

## Deployment Steps

### 1. Create a PostgreSQL Database on Render (Optional)

If you don't have a database yet:

1. Log in to your Render dashboard
2. Go to "New" → "PostgreSQL"
3. Configure your database:
   - Name: `status-page-db` (or any name you prefer)
   - Database: `statuspage`
   - User: `postgres` (or custom)
   - Choose a region close to your users
   - Select a plan that fits your needs
4. Click "Create Database"
5. Once created, copy the "External Database URL" for later use

### 2. Deploy the Status Page Application

#### Option 1: Manual Deployment

1. Log in to your Render dashboard
2. Go to "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `status-page` (or any name you prefer)
   - Environment: "Docker"
   - Branch: `main` (or your preferred branch)
   - Region: Choose a region close to your users
   - Plan: Select an appropriate plan
5. Set environment variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your PostgreSQL connection string (from step 1)
   - `NEXT_PUBLIC_APP_URL`: Will be automatically set to your Render URL
6. Click "Create Web Service"

#### Option 2: Blueprint Deployment (Using render.yaml)

1. Make sure the `render.yaml` file is in your repository
2. Log in to your Render dashboard
3. Go to "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will detect the `render.yaml` file and offer to deploy the defined services
6. Configure any additional environment variables as needed
7. Click "Apply" to start the deployment

### 3. Monitor Deployment

1. Render will build and deploy your application
2. You can monitor the build progress in the dashboard
3. Once deployed, you can access your application at the URL provided by Render

### 4. Set Up Custom Domain (Optional)

1. Go to your web service in the Render dashboard
2. Navigate to "Settings" → "Custom Domain"
3. Add your domain and follow the instructions to configure DNS

## Troubleshooting

- If the build fails, check the build logs for errors
- Ensure your database connection string is correct
- Verify that all required environment variables are set
- If you encounter memory issues during build, consider upgrading your plan or optimizing your build process

## Maintenance

- Render can automatically deploy when you push to your repository
- Monitor your application's performance in the Render dashboard
- Scale your service as needed by changing plans or adding instances 