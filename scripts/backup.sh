#!/bin/sh
# Backs up the database and uploaded media into ./backups (or $BACKUP_DIR), keeping the newest $KEEP sets (default 14).
# Usage: DATABASE_URL=... UPLOAD_DIR=... sh scripts/backup.sh
# With Docker Compose: see README ("النسخ الاحتياطي").
set -eu
: "${DATABASE_URL:?set DATABASE_URL}"
dir="${BACKUP_DIR:-./backups}"
stamp="$(date -u +%Y%m%d-%H%M%S)"
mkdir -p "$dir"
pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL" > "$dir/db-$stamp.dump"
if [ -d "${UPLOAD_DIR:-./uploads}" ]; then
  tar -czf "$dir/uploads-$stamp.tar.gz" -C "${UPLOAD_DIR:-./uploads}" .
fi
# Remove sets older than the newest $KEEP.
for kind in db uploads; do
  ls -1t "$dir"/$kind-* 2>/dev/null | tail -n +$(( ${KEEP:-14} + 1 )) | xargs -r rm -f
done
echo "backup written: $dir/db-$stamp.dump"
