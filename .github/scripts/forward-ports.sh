#!/usr/bin/env bash
set -euo pipefail

# Built-in SOLO port forwarding does not work :/
# Port forwarding stops shortly after a one-shot Falcon start in GitHub actions.
# For this reason, we use this script to start port forwarding directly via Bash,
# instead of relying on the Node.js script.
# This approach keeps the connection stable and ensures it lasts throughout the tests.

FORWARDS=(
  "mirror-1-rest|5551"
  "network-node1|50211"
  "relay-1|7546"
  "mirror-1-grpc|5600"
)

ps aux | grep "port-forward" | grep kubectl | awk '{print $2}' | xargs -r kill -9
NS="$(kubectl get ns -o name | sed 's|^namespace/||' | grep '^solo' | grep -v '^solo-setup$' | head -n1)"
for row in "${FORWARDS[@]}"; do
  IFS='|' read -r include port <<<"$row"
  POD="$(kubectl get pods -A --no-headers | grep -E "$include" | head -n 1 | awk '{print $2}' | head -n1)"
  kubectl port-forward "$POD" -n "$NS" "${port}:${port}" >/dev/null 2>&1 &
done
