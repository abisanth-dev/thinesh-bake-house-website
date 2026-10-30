#!/bin/sh
# Run by a cPanel cron job on the tbhweb account: pulls the latest build from the `deploy` branch
# (published by .github/workflows/deploy-cpanel.yml) and restarts the Passenger app when it changed.
cd "$HOME/tbh-app" || exit 1
git fetch -q origin deploy || exit 1
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/deploy)" ] && exit 0
git checkout -q -B deploy origin/deploy
git reset -q --hard origin/deploy
mkdir -p tmp && touch tmp/restart.txt
echo "$(date '+%F %T') deployed $(git log -1 --format=%s)" >> update.log
