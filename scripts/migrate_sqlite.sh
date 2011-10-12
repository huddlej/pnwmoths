#!/bin/sh

# Back up current MySQL database.
#mysqldump -u pnwmoths -p pnwmoths > mysql_dump.sql

# Dump current sqlite database.
mkdir -p sql
echo ".dump" | /usr/bin/sqlite3 pnwmoths.db > sql/cms_data.sql

# Fix differing SQL syntax.
sed -i 's/"/`/g' sql/cms_data.sql
sed -i '/BEGIN/d;/COMMIT/d;' sql/cms_data.sql
sed -i 's/autoincrement/auto_increment/g' sql/cms_data.sql

# Import sqlite data into MySQL.
cat sql/cms_data.sql | mysql -u pnwmoths -p test

