#!/bin/bash
# Simple cURL test for OpenRouter API key

echo "Testing OpenRouter API with cURL..."
echo "Using API key: sk-or-v1-b1fc83...b397"

# Perform the API call with proper headers
response=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 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" \
  -H "HTTP-Referer: https://localhost" \
  -H "X-Title: API Key Test" \
  -d '{"model":"google/gemini-2.0-pro-exp-02-05:free","messages":[{"role":"user","content":"Hello, this is a cURL test."}],"max_tokens":50}' \
  https://openrouter.ai/api/v1/chat/completions)

# Separate body and status code
http_body=$(echo "$response" | head -n 1)
http_code=$(echo "$response" | tail -n 1)

echo "HTTP Status Code: $http_code"
echo "Response Body:"
echo "$http_body"

# Check if request was successful
if [ "$http_code" -eq 200 ]; then
    echo "SUCCESS: API key is working correctly!"
else
    echo "ERROR: API key validation failed with status code $http_code"
    echo "Please verify your OpenRouter account status and API key validity."
    
    if [[ "$http_body" == *"No auth credentials found"* ]]; then
        echo "The specific error indicates that the API key was not recognized."
        echo "Possible causes:"
        echo "1. The API key has been revoked or has expired"
        echo "2. The account associated with this key has been suspended"
        echo "3. There may be a newer version of the API requiring different authentication"
    fi
    
    echo "Visit https://openrouter.ai/keys to verify your API key status or generate a new one."
fi