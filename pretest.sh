#!/bin/sh
cd "$(dirname "$0")"

docker_mongo_missing() {
    echo "\xE2\x9C\x98 ../ktt-docker-mongo sibling repo not found. Please clone from GitHub."
    exit 1
}

docker_missing() {
    echo "\xE2\x9C\x98 Please have the docker daemon running."
    exit 1
}

[ -d "../ktt-docker-mongo" ] || (docker_mongo_missing)

docker ps > /dev/null || (docker_missing)

echo "\xE2\x9C\x94 Dependencies passed!"

sh ../ktt-docker-mongo/startasync.sh

sh ../ktt-docker-mongo/wait.sh && echo "\xE2\x9C\x94 Ready for testing!"