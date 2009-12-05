#!/bin/sh
release=$1
echo "Building release" $release
release_name="releases/pnwmoths-$release.zip"
zip $release_name *.js *.htm* moths.css moths.csv icon.png Autographa_californica_-_Alfalfa_Looper_files/*
