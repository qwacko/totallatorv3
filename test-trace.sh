#!/bin/bash

# Generate proper timestamps
START_TIME=$(date +%s%N)
END_TIME=$((START_TIME + 1000000000)) # 1 second later

# Create a proper OTLP trace
curl -X POST http://otel-lgtm:4318/v1/traces \
  -H "Content-Type: application/json" \
  -d "{
    \"resourceSpans\": [{
      \"resource\": {
        \"attributes\": [
          {\"key\": \"service.name\", \"value\": {\"stringValue\": \"totallator-test\"}}
        ]
      },
      \"scopeSpans\": [{
        \"spans\": [{
          \"traceId\": \"$(openssl rand -hex 16)\",
          \"spanId\": \"$(openssl rand -hex 8)\",
          \"name\": \"test-span2\",
          \"kind\": 1,
          \"startTimeUnixNano\": \"$START_TIME\",
          \"endTimeUnixNano\": \"$END_TIME\",
          \"status\": {\"code\": 1}
        }]
      }]
    }]
  }"

echo "Trace sent to Tempo"