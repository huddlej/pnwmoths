#!/usr/bin/env sh

cd $1
for image in *.jpg
do
    echo $image
    convert "$image" -resize '800' "test/$image"
done