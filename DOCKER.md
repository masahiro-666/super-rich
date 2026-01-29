# Docker Deployment Guide

This guide explains how to deploy the Super Rich Monopoly Money application using Docker.

## Prerequisites

- Docker installed on your system ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose (usually included with Docker Desktop)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Build and start the container:**

   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - Open your browser and go to: `http://localhost:3000`

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker CLI

1. **Build the Docker image:**

   ```bash
   docker build -t super-rich-monopoly .
   ```

2. **Run the container:**

   ```bash
   docker run -d -p 3000:3000 --name super-rich-app super-rich-monopoly
   ```

3. **Access the application:**
   - Open your browser and go to: `http://localhost:3000`

4. **Stop and remove the container:**
   ```bash
   docker stop super-rich-app
   docker rm super-rich-app
   ```

## Docker Commands Reference

### View running containers:

```bash
docker ps
```

### View container logs:

```bash
# Using Docker Compose
docker-compose logs -f

# Using Docker CLI
docker logs -f super-rich-app
```

### Rebuild after code changes:

```bash
# Using Docker Compose
docker-compose up -d --build

# Using Docker CLI
docker build -t super-rich-monopoly .
docker stop super-rich-app
docker rm super-rich-app
docker run -d -p 3000:3000 --name super-rich-app super-rich-monopoly
```

### Remove all containers and images:

```bash
# Stop and remove containers
docker-compose down

# Remove the image
docker rmi super-rich-monopoly
```

## Configuration

### Port Configuration

By default, the application runs on port 3000. To use a different port:

**Docker Compose:** Edit `docker-compose.yml`:

```yaml
ports:
  - "8080:3000" # Access via localhost:8080
```

**Docker CLI:**

```bash
docker run -d -p 8080:3000 --name super-rich-app super-rich-monopoly
```

### Environment Variables

You can customize environment variables in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - HOSTNAME=0.0.0.0
```

## Deployment to Production

### Deploy to a Cloud Provider

#### AWS ECS / Azure Container Instances / Google Cloud Run

1. **Push image to a container registry:**

   ```bash
   # Example for Docker Hub
   docker tag super-rich-monopoly yourusername/super-rich-monopoly:latest
   docker push yourusername/super-rich-monopoly:latest
   ```

2. **Deploy using your cloud provider's container service**

#### Using Docker Swarm

```bash
docker swarm init
docker stack deploy -c docker-compose.yml super-rich
```

### Using a Reverse Proxy (Nginx/Traefik)

For production with SSL/HTTPS, place the container behind a reverse proxy:

```nginx
# Nginx configuration example
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs

# Or for Docker CLI
docker logs super-rich-app
```

### Port already in use

If port 3000 is already in use, change the port mapping:

```bash
docker run -d -p 3001:3000 --name super-rich-app super-rich-monopoly
```

### Changes not reflecting

Rebuild the container:

```bash
docker-compose up -d --build
```

### Socket.IO connection issues

Make sure WebSocket connections are allowed through your firewall/proxy.

## Architecture

The Docker setup uses a multi-stage build:

1. **deps stage**: Installs Node.js dependencies
2. **builder stage**: Builds the Next.js application
3. **runner stage**: Creates minimal production image with only necessary files

This approach results in:

- Smaller final image size
- Faster deployments
- Better security (fewer dependencies in production)

## Performance Tips

1. **Use Docker BuildKit** for faster builds:

   ```bash
   DOCKER_BUILDKIT=1 docker build -t super-rich-monopoly .
   ```

2. **Layer caching**: Docker caches layers, so dependency installation only runs when package.json changes

3. **Resource limits**: Limit container resources in production:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: "1"
         memory: 512M
   ```

## Support

For issues or questions about Docker deployment, check:

- Docker logs: `docker-compose logs -f`
- Application logs inside container: `docker exec -it super-rich-app sh`
- Network connectivity: Ensure port 3000 is accessible
