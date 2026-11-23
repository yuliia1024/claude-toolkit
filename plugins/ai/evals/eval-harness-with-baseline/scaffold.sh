#!/usr/bin/env bash
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cp -R "$here/fixture/." .
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.invalid commit -qm "helpdesk-triage 0.4.0"
