#!/bin/bash
BASE_URL="http://localhost:3000"

check_url() {
    url="$1"
    method="$2"
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$url")
    echo "$method $url -> $status"
}

echo "Checking API Endpoints (GET)..."
check_url "/api/agents/register" "GET"
check_url "/api/tasks" "GET"
check_url "/api/payouts" "GET"
check_url "/api/tasks/history" "GET"
check_url "/api/bots/listings" "GET"
check_url "/api/tasks/submissions" "GET"
check_url "/api/v1/keys" "GET"

echo "Checking Static Assets..."
check_url "/ConductorLogo.png" "GET"
check_url "/favicon.ico" "GET"
check_url "/site.webmanifest" "GET"
check_url "/android-chrome-192x192.png" "GET"
check_url "/styles/Home.module.css" "GET" # Should probably be 404 as it's not static? Or maybe under /_next/static?

echo "Checking POST Endpoints (as GET)..."
check_url "/api/agents/heartbeat" "GET"
check_url "/api/bots/advertise" "GET"
