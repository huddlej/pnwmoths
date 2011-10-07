#!/bin/bash -e
#
# Back up MySQL databases
#
PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
PATH="$PATH:/usr/local/mysql/bin"

# My config
BACKUP_DIR="/tmp"

# Do not backup these databases
IGNORE="test"

# Get list of all databases
DB_LIST=`mysql -Bse 'show databases'`

for db in $DB_LIST; do

        # set skip variable
        skip=0

        if [ "$IGNORE" != "" ]; then
                for i in $IGNORE; do
                        [ "$db" == "$i" ] && skip=1 || :
                done
        fi

        if [ "$skip" == "0" ]; then
                mysqldump $db | gzip -9 > $BACKUP_DIR/$db.sql.gz
        fi

done

exit 0