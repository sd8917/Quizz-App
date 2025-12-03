Param(
  [int]$Port = 6379,
  [string]$ContainerName = 'quiz-redis',
  [string]$Image = 'redis:7'
)

Write-Output "Starting Redis (container: $ContainerName) on port $Port with maxmemory-policy noeviction..."

docker run -p $Port`:6379 --name $ContainerName -d $Image redis-server --maxmemory-policy noeviction

Write-Output "To stop: docker rm -f $ContainerName"
