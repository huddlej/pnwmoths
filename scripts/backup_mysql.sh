#!/bin/sh
#
# Back up MySQL databases
#
/usr/local/bin/mysqldump pnwmoths | gzip -9 > pnwmoths.sql.gz
chmod 644 pnwmoths.sql.gz