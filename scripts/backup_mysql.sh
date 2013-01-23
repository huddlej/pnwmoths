#!/bin/sh
#
# Back up MySQL databases
#
/usr/local/bin/mysqldump pnwmoths | gzip -9 > pnwmoths.sql.gz
chmod 644 pnwmoths.sql.gz
/usr/local/bin/mysqldump pnwbutterflies | gzip -9 > pnwbutterflies.sql.gz
chmod 644 pnwbutterflies.sql.gz
/usr/local/bin/mysqldump pnwsawflies | gzip -9 > pnwsawflies.sql.gz
chmod 644 pnwsawflies.sql.gz
