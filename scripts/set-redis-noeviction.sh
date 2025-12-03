#!/usr/bin/env bash
# Apply maxmemory-policy noeviction to a running Redis instance using redis-cli
# Usage: ./scripts/set-redis-noeviction.sh [HOST] [PORT]

HOST=${1:-127.0.0.1}
PORT=${2:-6379}

echo "Setting maxmemory-policy to noeviction on ${HOST}:${PORT}"

redis-cli -h ${HOST} -p ${PORT} CONFIG SET maxmemory-policy noeviction

echo "(Optional) To persist this change to redis.conf, edit your redis.conf and set:\n  maxmemory-policy noeviction"
