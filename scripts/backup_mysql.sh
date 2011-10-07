#!/bin/sh
#
# Back up MySQL databases
#
/usr/local/bin/mysqldump pnwmoths | gzip -9 > /tmp/pnwmoths.sql.gz
chmod 644 /tmp/pnwmoths.sql.gz