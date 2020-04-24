#!/bin/sh
cd "$(dirname "$0")"

sh ../ktt-docker-mysql/stop.sh && sh ../ktt-docker-mongo/stop.sh && echo "\xE2\x9C\x94 Docker instances spun down!"