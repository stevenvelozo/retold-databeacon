# Workflow: Docker Local

Build a retold-databeacon Docker image and run it locally for testing or as a persistent local service.

## Prerequisites

- Docker (20.10 or later)
- Git

## Build the Image

```bash
git clone https://github.com/stevenvelozo/retold-databeacon.git
cd retold-databeacon

# Build the Docker image
docker build -t retold-databeacon .
```

The multi-stage build:
1. **Stage 1 (builder)**: Installs all dependencies, runs `npx quack build` to bundle the web UI, copies `pict.min.js`
2. **Stage 2 (runtime)**: Installs only production dependencies, copies built artifacts

## Run the Container

### Basic Run

```bash
docker run -d \
	--name databeacon \
	-p 8389:8389 \
	-v $(pwd)/data:/app/data \
	retold-databeacon
```

- `-p 8389:8389` -- maps the container port to your host
- `-v $(pwd)/data:/app/data` -- persists the SQLite database across container restarts

### Verify It's Running

```bash
# Check container status
docker ps

# Check logs
docker logs databeacon

# Health check
curl http://localhost:8389/beacon/ultravisor/status
```

### Custom Port

```bash
docker run -d \
	--name databeacon \
	-p 9000:9000 \
	-e PORT=9000 \
	-v $(pwd)/data:/app/data \
	retold-databeacon
```

### With a Config File

Create `config.json` on the host:

```json
{
	"APIServerPort": 8389,
	"LogStreams": [
		{ "streamtype": "console" },
		{
			"loggertype": "simpleflatfile",
			"showtimestamps": true,
			"formattedtimestamps": true,
			"level": "trace",
			"path": "/app/data/beacon.log"
		}
	]
}
```

```bash
docker run -d \
	--name databeacon \
	-p 8389:8389 \
	-v $(pwd)/data:/app/data \
	-v $(pwd)/config.json:/app/config.json \
	retold-databeacon \
	node bin/retold-databeacon.js serve --config /app/config.json
```

## Connecting to a Host Database

### Connect to MySQL on the Host

Use Docker's special DNS name `host.docker.internal` to reach services on the Docker host:

```bash
curl -X POST http://localhost:8389/beacon/connection \
	-H 'Content-Type: application/json' \
	-d '{
		"Name": "Host MySQL",
		"Type": "MySQL",
		"Config": {
			"host": "host.docker.internal",
			"port": 3306,
			"database": "myapp",
			"user": "readonly",
			"password": "secret"
		},
		"AutoConnect": true
	}'
```

### Connect to Another Docker Container

If your database runs in a Docker container, use Docker networking:

```bash
# Create a shared network
docker network create beacon-net

# Run your database
docker run -d --name mysql-db --network beacon-net \
	-e MYSQL_ROOT_PASSWORD=rootpass \
	-e MYSQL_DATABASE=appdb \
	mysql:8

# Run DataBeacon on the same network
docker run -d --name databeacon --network beacon-net \
	-p 8389:8389 \
	-v $(pwd)/data:/app/data \
	retold-databeacon
```

Then connect using the container name as the host:

```bash
curl -X POST http://localhost:8389/beacon/connection \
	-H 'Content-Type: application/json' \
	-d '{
		"Name": "Docker MySQL",
		"Type": "MySQL",
		"Config": {
			"host": "mysql-db",
			"port": 3306,
			"database": "appdb",
			"user": "root",
			"password": "rootpass"
		}
	}'
```

## Docker Compose

For more complex setups, use Docker Compose:

```yaml
version: '3.8'

services:
  databeacon:
    build: .
    ports:
      - "8389:8389"
    volumes:
      - beacon-data:/app/data
    networks:
      - beacon-net
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8389/beacon/ultravisor/status',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3

  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: appdb
    networks:
      - beacon-net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 10

volumes:
  beacon-data:

networks:
  beacon-net:
```

```bash
docker compose up -d
```

---

## Stand-Alone Mode (No Ultravisor)

Docker containers run stand-alone by default. All features work without Ultravisor -- connections, introspection, dynamic endpoints, and the web UI are fully functional.

---

## With a Local Ultravisor Container

Add Ultravisor to the Docker Compose:

```yaml
  ultravisor:
    image: node:20-slim
    command: npx ultravisor serve --port 54321
    ports:
      - "54321:54321"
    networks:
      - beacon-net
```

Then connect DataBeacon to it:

```bash
curl -X POST http://localhost:8389/beacon/ultravisor/connect \
	-H 'Content-Type: application/json' \
	-d '{
		"ServerURL": "http://ultravisor:54321",
		"Name": "docker-databeacon"
	}'
```

---

## Connecting to a Remote Ultravisor

```bash
curl -X POST http://localhost:8389/beacon/ultravisor/connect \
	-H 'Content-Type: application/json' \
	-d '{
		"ServerURL": "https://ultravisor.corp.example.com:54321",
		"Name": "docker-local-beacon",
		"Password": "mesh-auth-token",
		"Tags": { "location": "local-dev" }
	}'
```

---

## Stopping and Cleanup

```bash
# Stop the container
docker stop databeacon

# Remove (data persists in the volume)
docker rm databeacon

# Full cleanup
docker compose down -v
```
