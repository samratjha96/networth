#!/bin/bash

set -euxo pipefail

git pull

docker compose down

docker compose up --build -d
