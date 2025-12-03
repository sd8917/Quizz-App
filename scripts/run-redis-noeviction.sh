#!/usr/bin/env bash
# Run Redis in Docker with maxmemory-policy set to noeviction
# Usage: ./scripts/run-redis-noeviction.sh [REDIS_PORT]

PORT=${1:-6379}
CONTAINER_NAME=${CONTAINER_NAME:-quiz-redis}
IMAGE=${IMAGE:-redis:7}

echo "Starting Redis (container: $CONTAINER_NAME) on port $PORT with maxmemory-policy noeviction..."

docker run -p ${PORT}:6379 --name ${CONTAINER_NAME} -d ${IMAGE} redis-server --maxmemory-policy noeviction

echo "To stop: docker rm -f ${CONTAINER_NAME}"
