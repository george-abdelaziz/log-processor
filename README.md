# User Activity Processor Microservice

This microservice listens for user activity logs from a Kafka topic, processes them, and stores them in MongoDB. It also provides a REST API to query the processed logs.

Built with Node.js, KafkaJS, Mongoose, Express, Docker, and Kubernetes.

## Features

*   Event-driven architecture using Kafka.
*   Stores processed logs in MongoDB with indexes for efficient querying.
*   REST API (`/logs`) for fetching logs with filtering (userId, action, date range, ipAddress), pagination, and sorting.
*   Containerized using Docker.
*   Kubernetes manifests for deployment.
*   Structured following Domain-Driven Design (DDD) principles.
*   Graceful shutdown handling.

## Project Structure

```
user-activity-processor/
├── k8s/                  # Kubernetes manifests
│   ├── configmap.yaml
│   ├── deployment.yaml
│   └── service.yaml
├── src/
│   ├── application/      # Application layer (use cases)
│   │   └── services/     # Application services
│   │       └── LogProcessingService.js
│   ├── domain/           # Domain layer (core business logic)
│   │   ├── model/        # Domain models/entities
│   │   │   └── UserActivityLog.js
│   │   └── repositories/ # Abstract repository interfaces (if needed)
│   ├── infrastructure/   # Infrastructure layer (external concerns)
│   │   ├── config/       # Configuration loading, logging
│   │   │   └── index.js
│   │   ├── database/     # Database interactions (MongoDB)
│   │   │   └── mongoRepository.js
│   │   └── messaging/    # Messaging interactions (Kafka)
│   │       ├── kafkaConsumer.js
│   │       └── kafkaProducer.js
│   ├── interfaces/       # Interfaces layer (entry points)
│   │   └── http/         # HTTP interface (REST API)
│   │       ├── controllers/
│   │       │   └── logController.js
│   │       ├── middleware/ # Express middleware (if any)
│   │       ├── routes/
│   │       │   └── logRoutes.js
│   │       └── server.js   # Express server setup
│   └── index.js          # Application entry point
├── .dockerignore
├── .env.example          # Example environment variables
├── .gitignore
├── Dockerfile
├── package-lock.json
├── package.json
└── README.md
```

## Prerequisites

*   Node.js (v18+ recommended)
*   npm
*   Docker
*   kubectl (for Kubernetes deployment)
*   Access to a Kafka cluster
*   Access to a MongoDB instance

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd user-activity-processor
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    *   Copy `.env.example` to `.env`:
        ```bash
        cp .env .env
        ```
    *   Edit `.env` and fill in your Kafka broker addresses (`KAFKA_BROKERS`) and MongoDB connection URI (`MONGODB_URI`).

4.  **Ensure Kafka and MongoDB are running and accessible.**
    *   Make sure the Kafka topic specified in `KAFKA_TOPIC` exists.

5.  **Run the service locally:**
    ```bash
    npm start
    # or for development with nodemon (install separately: npm i -g nodemon)
    # nodemon src/index.js
    ```
    The service will connect to Kafka/MongoDB, start the consumer, and the HTTP server (default port 3000).

## Testing the Flow

1.  **Send a log message (using the test POST endpoint):**
    Use `curl` or a tool like Postman to send a POST request to `http://localhost:3000/logs`:
    ```bash
    curl -X POST http://localhost:3000/logs \
         -H "Content-Type: application/json" \
         -d '{
              "userId": "user-123",
              "action": "login",
              "details": { "browser": "Chrome", "os": "Windows" },
              "ipAddress": "192.168.1.100"
            }'
    ```
    You should see logs indicating the message was sent to Kafka and then processed by the consumer and saved to MongoDB.

2.  **Fetch processed logs:**
    Open your browser or use `curl` to access `http://localhost:3000/logs`.
    *   `http://localhost:3000/logs` (gets first page)
    *   `http://localhost:3000/logs?userId=user-123` (filter by user)
    *   `http://localhost:3000/logs?action=login&limit=5&page=2` (filter, paginate)
    *   `http://localhost:3000/logs?startDate=2023-10-26T00:00:00Z&endDate=2023-10-27T23:59:59Z` (filter by date range)
    *   `http://localhost:3000/logs?sortBy=timestamp&sortOrder=asc` (sort)

## Running with Docker

1.  **Build the Docker image:**
    ```bash
    docker build -t user-activity-processor:latest .
    # Or tag it for your Docker Hub account
    # docker build -t <your-dockerhub-username>/user-activity-processor:latest .
    ```

2.  **Run the container:**
    You need to provide the environment variables to the container. You can use a `.env` file:
    ```bash
    docker run --rm --name user-activity-app \
           --env-file .env \
           -p 3000:3000 \
           user-activity-processor:latest
           # Use your tagged image name if applicable
    ```
    *   `--rm`: Automatically remove the container when it exits.
    *   `--name`: Assign a name to the container.
    *   `--env-file .env`: Load environment variables from the `.env` file.
    *   `-p 3000:3000`: Map port 3000 on the host to port 3000 in the container.
    *   Ensure the Kafka and MongoDB URIs in your `.env` file are accessible *from the Docker container* (e.g., use host IP, Docker network aliases like `host.docker.internal`, or service names if using Docker Compose).

## Deploying to Kubernetes

1.  **Prerequisites:**
    *   A running Kubernetes cluster.
    *   `kubectl` configured to connect to your cluster.
    *   A Docker image registry (like Docker Hub, GCR, ECR) where you can push your image.
    *   Kafka and MongoDB accessible from within the Kubernetes cluster (either running in K8s or externally).

2.  **Build and Push the Docker Image:**
    ```bash
    # Tag the image for your registry
    docker build -t <your-registry>/user-activity-processor:v1.0.0 .
    # Push the image
    docker push <your-registry>/user-activity-processor:v1.0.0
    ```
    (Replace `<your-registry>` and `v1.0.0` appropriately)

3.  **Configure Kubernetes Manifests:**
    *   Edit `k8s/configmap.yaml`: Update `KAFKA_BROKERS` and `MONGODB_URI` to point to the correct addresses accessible *within* the K8s cluster (e.g., K8s service names like `kafka-service.kafka-namespace.svc.cluster.local` or external IPs/DNS).
    *   Edit `k8s/deployment.yaml`: Change the `spec.template.spec.containers[0].image` field to your pushed Docker image name (e.g., `<your-registry>/user-activity-processor:v1.0.0`).
    *   **(Security Recommendation)** If your MongoDB URI or Kafka connection requires credentials, create a Kubernetes `Secret` instead of putting them directly in the `ConfigMap`. Update the `Deployment` to load environment variables from the `Secret`.
    *   Edit `k8s/service.yaml`: Choose the appropriate `spec.type` (`ClusterIP`, `NodePort`, or `LoadBalancer`) based on how you want to expose the API.

4.  **Apply the Manifests:**
    ```bash
    # Apply the ConfigMap first
    kubectl apply -f k8s/configmap.yaml

    # Apply the Deployment (this will pull the image and create pods)
    kubectl apply -f k8s/deployment.yaml

    # Apply the Service (to expose the Deployment)
    kubectl apply -f k8s/service.yaml
    ```

5.  **Verify the Deployment:**
    ```bash
    # Check if pods are running
    kubectl get pods -l app=user-activity-processor

    # Check logs of a pod
    kubectl logs <pod-name>

    # Check the service
    kubectl get service user-activity-processor-service
    ```

6.  **Access the Service:**
    *   If `type: ClusterIP`, you might need port-forwarding for local access:
        ```bash
        kubectl port-forward service/user-activity-processor-service 8080:80
        ```
        Then access `http://localhost:8080/logs`.
    *   If `type: NodePort`, find the NodePort using `kubectl get service` and access `http://<NodeIP>:<NodePort>/logs`.
    *   If `type: LoadBalancer`, find the external IP using `kubectl get service` and access `http://<ExternalIP>/logs`.

## Environment Variables

See `.env.example` for a full list of environment variables used for configuration. 