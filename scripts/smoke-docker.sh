#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

cleanup() {
  docker compose down >/dev/null 2>&1 || true
}

trap cleanup EXIT

wait_for_url() {
  local name="$1"
  local url="$2"
  local attempts="${3:-30}"
  local sleep_seconds="${4:-2}"

  echo "Waiting for ${name} at ${url}..."
  for i in $(seq 1 "${attempts}"); do
    if curl -sf "${url}" >/dev/null 2>&1; then
      echo "  ${name} is ready (${i}/${attempts})"
      return 0
    fi
    sleep "${sleep_seconds}"
  done

  echo "Timed out waiting for ${name} (${url})."
  return 1
}

echo "Starting Docker services..."
docker compose up -d --build

wait_for_url "API health" "http://localhost:3002/health"
wait_for_url "Web root" "http://localhost:3000"

api_health="$(curl -s http://localhost:3002/health)"
if [[ "${api_health}" != *'"status":"ok"'* ]]; then
  echo "API /health did not return an ok status: ${api_health}"
  exit 1
fi

web_headers="$(curl -sI http://localhost:3000/)"
if [[ "${web_headers}" != *" 307 "* ]] && [[ "${web_headers}" != *" 308 "* ]]; then
  echo "Web root did not return a redirect response:"
  echo "${web_headers}"
  exit 1
fi
if [[ "${web_headers}" != *$'Location: /sign-in\r'* ]] && [[ "${web_headers}" != *$'location: /sign-in\r'* ]]; then
  echo "Web root redirect target is not /sign-in:"
  echo "${web_headers}"
  exit 1
fi

trpc_health="$(curl -s http://localhost:3000/api/trpc/health)"
if [[ "${trpc_health}" != *'"status":"ok"'* ]]; then
  echo "tRPC proxy health did not return an ok status: ${trpc_health}"
  exit 1
fi

echo "Docker smoke verification passed."
