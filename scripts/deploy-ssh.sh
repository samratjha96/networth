#!/bin/bash

set -euo pipefail

ssh homelab-cloud <<'EOF'
set -euo pipefail

cd ~/Github/networth
bash scripts/deploy.sh
EOF
