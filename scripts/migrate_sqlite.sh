#!/bin/bash
set -e

# Make sure we're on master branch.
git co master

# Back up current MySQL database.
echo "dump current database"
mysqldump -u pnwmoths -p pnwmoths > mysql_dump.sql

# Create a test database in MySQL.
echo "create test db"
echo "create database test; grant all privileges on test.* to 'pnwmoths'@'localhost';" | mysql -u root -p

# Load original MySQL data into test database.
echo "load original data"
cat mysql_dump.sql | mysql -u pnwmoths -p test

# Dump Django data from sqlite.
./manage.py dumpdata -n --format=json contenttypes > contenttypes.json
./manage.py dumpdata -n --format=json auth > auth.json
./manage.py dumpdata -n --format=json --exclude=contenttypes --exclude=auth > data.json

# Switch branches to "sqlite" and create missing db structure.
git co sqlite
./manage.py syncdb --noinput

# Delete default values for content types and auth.
./manage.py reset --noinput contenttypes auth

# Load sqlite data into MySQL.
./manage.py loaddata contenttypes.json
./manage.py loaddata auth.json
./manage.py loaddata data.json