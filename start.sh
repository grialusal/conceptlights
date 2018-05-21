#!/usr/bin/env bash
export TEI_DIR=~/Documents/TEI-XML-2018
export MYSQL_DUMP=~/Documents/mysql_dump/

# quick script to create and run docker image, with db migrations
if [ -z ${TEI_DIR+x} ]; then 
	echo "TEI_DIR variable is not set. Try setting it first using 'export TEI_DIR=/path/to/dir'";
	exit;
fi

if [ ! -d "$TEI_DIR" ] || [ -z "$(ls -A $TEI_DIR)" ]; then
	echo "$TEI_DIR does not exist or it is empty. Aborting.";
	exit;
fi

if [ -z ${MYSQL_DUMP+x} ]; then 
	echo "MYSQL_DUMP variable is not set. Try setting it first using 'export MYSQL_DUMP=/path/to/mysql_dump.sql'";
	exit;
fi

if [! -e "$MYSQL_DUMP" ]
then
    echo "I couldn't find a sql dump in $MYSQL_DUMP. Try setting it first using 'export MYSQL_DUMP=/path/to/mysql_dump.sql'";
	exit;
fi


echo "TEI_DIR is set to $TEI_DIR"
echo "MYSQL_DUMP is set to $MYSQL_DUMP" 

docker-compose up -d --build

sleep 5

echo "Navigate to conceptlights with http://localhost:8080"
if [ -z "$1" ]
  then
    docker attach conceptlights
fi
