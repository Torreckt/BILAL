#!/bin/sh
# Restores a backup made by backup.sh INTO the database in DATABASE_URL, replacing what is there.
# Usage: DATABASE_URL=... UPLOAD_DIR=... sh scripts/restore.sh backups/db-YYYYMMDD-HHMMSS.dump [backups/uploads-....tar.gz]
set -eu
: "${DATABASE_URL:?set DATABASE_URL}"
dump="${1:?path to db-*.dump}"
pg_restore --clean --if-exists --no-owner --no-privileges --single-transaction --dbname "$DATABASE_URL" "$dump"
if [ -n "${2:-}" ]; then
  mkdir -p "${UPLOAD_DIR:-./uploads}"
  tar -xzf "$2" -C "${UPLOAD_DIR:-./uploads}"
fi
echo "restore finished from $dump"
