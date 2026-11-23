#!/usr/bin/env bash
# Base project as one commit, then the change under review left uncommitted in the working tree.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cp -R "$here/fixture/base/." .
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.invalid commit -qm "orders-service base"
cp -R "$here/fixture/change/." .
