#!/usr/bin/env bash

# Forward MirrorNode port
kubectl port-forward "$(kubectl get pods -A | grep 'mirror-1-rest-' | awk '{print $2}')" \
  -n "$(kubectl get namespaces | grep solo | grep -v 'solo-setup' | awk '{print $1}')" \
  5551:5551 >/dev/null 2>&1
kubectl port-forward network-node1-0 \
  -n "$(kubectl get namespaces | grep solo | grep -v 'solo-setup' | awk '{print $1}')" \
  50211:50211 \
  >/dev/null 2>&1
# NOTE:
# I’m running solo with `force port enabled = true`.
# In GitHub Actions, the port-forward stops abruptly, which shouldn’t happen.
# I’m not sure why this occurs yet and need to investigate or ask someone about it.
# For now, this script is a workaround to keep the port available.

#while true; do
#  (echo >/dev/tcp/127.0.0.1/50211) >/dev/null 2>&1 || \
#    kubectl port-forward network-node1-0 \
#      -n "$(kubectl get namespaces | grep solo | grep -v 'solo-setup' | awk '{print $1}')" \
#      50211:50211 \
#      >/dev/null 2>&1
#  sleep 5
#done
