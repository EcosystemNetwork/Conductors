#!/bin/bash

# Function to test an endpoint
test_endpoint() {
    URL=$1
    echo "Testing $URL..."
    curl -v --max-time 5 $URL
    echo -e "\nResult: $?"
}

echo "--- Checking non-DB endpoint ---"
test_endpoint "http://localhost:3000/api/test"

echo -e "\n--- Checking known existing endpoint ---"
test_endpoint "http://localhost:3000/api/bots/listings"

echo -e "\n--- Checking new endpoint ---"
test_endpoint "http://localhost:3000/api/v1/keys"
