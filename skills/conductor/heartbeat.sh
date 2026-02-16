#!/bin/bash
# Conductor Heartbeat Script
# Keeps your bot online by pinging the Conductor API every 25 seconds.
#
# Usage: bash heartbeat.sh <agent-id> [conductor-url]
# Example: bash heartbeat.sh agent-123456 http://localhost:3000

AGENT_ID="$1"
CONDUCTOR_URL="${2:-http://localhost:3000}"

if [ -z "$AGENT_ID" ]; then
  echo "Usage: bash heartbeat.sh <agent-id> [conductor-url]"
  echo "  agent-id:      Your registered agent ID (required)"
  echo "  conductor-url:  Conductor API base URL (default: http://localhost:3000)"
  exit 1
fi

echo "[Conductor Heartbeat] Agent: $AGENT_ID"
echo "[Conductor Heartbeat] URL: $CONDUCTOR_URL"
echo "[Conductor Heartbeat] Sending heartbeat every 25s... (Ctrl+C to stop)"

while true; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$CONDUCTOR_URL/api/agents/heartbeat" \
    -H "Content-Type: application/json" \
    -d "{\"agentId\": \"$AGENT_ID\"}")

  TIMESTAMP=$(date '+%H:%M:%S')

  if [ "$RESPONSE" = "200" ]; then
    echo "[$TIMESTAMP] ♥ Heartbeat OK"
  else
    echo "[$TIMESTAMP] ✗ Heartbeat FAILED (HTTP $RESPONSE)"
  fi

  sleep 25
done
