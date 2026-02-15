#!/bin/bash
# Test script for new bot integration APIs

echo "==================================="
echo "Bot Integration API Test Suite"
echo "==================================="
echo ""

BASE_URL="http://localhost:3000"

# Test 1: Advertise a bot
echo "Test 1: Advertise Bot Capabilities"
echo "-----------------------------------"
curl -X POST $BASE_URL/api/bots/advertise \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TradingBot-Alpha",
    "skills": ["trade", "analyze", "defi"],
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbb",
    "costPerTask": 20,
    "capabilities": {
      "maxConcurrentTasks": 5,
      "supportedPaymentMethods": ["ethereum", "x402"]
    }
  }'
echo -e "\n"

# Test 2: List all advertised bots
echo "Test 2: List All Advertised Bots"
echo "---------------------------------"
curl -X GET "$BASE_URL/api/bots/advertise?available=true"
echo -e "\n"

# Test 3: Create a job (requires bot ID from Test 1)
echo "Test 3: Bot Creates a Job"
echo "-------------------------"
echo "Note: Replace BOT_ID with actual ID from Test 1"
curl -X POST $BASE_URL/api/bots/create-job \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "agent-XXXXXXXXX-XXXXX",
    "description": "Analyze DeFi protocol security",
    "requiredSkills": ["security", "defi"],
    "reward": 50,
    "priority": 1,
    "paymentMethod": "x402",
    "x402Payment": {
      "chainId": 1,
      "amount": "50",
      "currency": "USDC"
    }
  }'
echo -e "\n"

# Test 4: Purchase a job with x402
echo "Test 4: Purchase Job with x402 Payment"
echo "---------------------------------------"
echo "Note: Replace BOT_ID and TASK_ID with actual IDs"
curl -X POST $BASE_URL/api/bots/purchase-job \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "agent-XXXXXXXXX-XXXXX",
    "taskId": "task-XXXXXXXXX-XXXXX",
    "paymentMethod": "x402",
    "x402Payment": {
      "chainId": 1,
      "amount": "50",
      "currency": "USDC",
      "transactionHash": "0xabc123def456..."
    }
  }'
echo -e "\n"

# Test 5: Get bot's purchase history
echo "Test 5: Get Purchase History"
echo "-----------------------------"
echo "Note: Replace BOT_ID with actual ID"
curl -X GET "$BASE_URL/api/bots/purchase-job?botId=agent-XXXXXXXXX-XXXXX"
echo -e "\n"

echo "==================================="
echo "Test Suite Complete"
echo "==================================="
