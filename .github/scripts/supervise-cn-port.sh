#!/usr/bin/env bash

# NOTE:
# I’m running solo with `force port enabled = true`.
# In GitHub Actions, the port-forward stops abruptly, which shouldn’t happen.
# I’m not sure why this occurs yet and need to investigate or ask someone about it.
# For now, this script is a workaround to keep the port available.

while true; do
  nc -z localhost 50211 >/dev/null 2>&1 || \
    kubectl port-forward network-node1-0 \
      -n "$(kubectl get namespaces | grep solo | grep -v 'solo-setup' | awk '{print $1}')" \
      50211:50211
  sleep 1
done
