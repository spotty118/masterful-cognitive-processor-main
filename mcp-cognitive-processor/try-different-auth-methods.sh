#!/bin/bash
# Test different authentication methods with OpenRouter API

API_KEY="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"
API_BASE="https://openrouter.ai/api/v1"

echo "======================================"
echo "Testing OpenRouter API authentication"
echo "======================================"
echo "API Key: ${API_KEY:0:12}...${API_KEY: -12}"
echo "Testing multiple authentication methods and endpoints..."
echo ""

# Method 1: Standard Bearer token
echo "Method 1: Standard Bearer token"
response=$(curl -s -w "\n%{http_code}" \
  -X GET \
  -H "Authorization: Bearer $API_KEY" \
  -H "HTTP-Referer: https://localhost" \
  "$API_BASE/auth/key")

body=$(echo "$response" | head -n 1)
code=$(echo "$response" | tail -n 1)

echo "Status: $code"
echo "Response: $body"
echo ""

# Method 2: Try models endpoint which might be less restrictive
echo "Method 2: Models endpoint"
response=$(curl -s -w "\n%{http_code}" \
  -X GET \
  -H "Authorization: Bearer $API_KEY" \
  -H "HTTP-Referer: https://localhost" \
  "$API_BASE/models")

body=$(echo "$response" | head -n 1)
code=$(echo "$response" | tail -n 1)

echo "Status: $code"
echo "Response: $body"
echo ""

# Method 3: Try without "Bearer" prefix
echo "Method 3: Direct API key (no Bearer prefix)"
response=$(curl -s -w "\n%{http_code}" \
  -X GET \
  -H "Authorization: $API_KEY" \
  -H "HTTP-Referer: https://localhost" \
  "$API_BASE/auth/key")

body=$(echo "$response" | head -n 1)
code=$(echo "$response" | tail -n 1)

echo "Status: $code"
echo "Response: $body"
echo ""

# Method 4: Try adding as a query parameter
echo "Method 4: API key as query parameter"
response=$(curl -s -w "\n%{http_code}" \
  -X GET \
  -H "HTTP-Referer: https://localhost" \
  "$API_BASE/auth/key?api_key=$API_KEY")

body=$(echo "$response" | head -n 1)
code=$(echo "$response" | tail -n 1)

echo "Status: $code"
echo "Response: $body"
echo ""

# Method 5: Try with OpenAI compatible endpoint
echo "Method 5: OpenAI compatibility endpoint"
response=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "HTTP-Referer: https://localhost" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hello, are you working?"}]}' \
  "$API_BASE/chat/completions")

body=$(echo "$response" | head -n 1)
code=$(echo "$response" | tail -n 1)

echo "Status: $code"
echo "Response: $body"
echo ""

echo "======================================"
echo "API Authentication Testing completed"
echo "======================================"

# Final assessment
if [[ "$code" == "200" ]]; then
  echo "SUCCESS! At least one method worked."
else
  echo "All authentication methods failed."
  echo "This strongly indicates the API key is no longer valid or your OpenRouter account needs attention."
  echo "Please visit https://openrouter.ai to check your account status."
  echo "You may need to generate a new API key."
fi