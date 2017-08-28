#!/bin/bash
EXT_DIRNAME=./ODE_Chrome
EXT_SRC=./src

rm -rf $EXT_DIRNAME

mkdir -pv $EXT_DIRNAME


SRC_DIR=./
DST_DIR=$EXT_DIRNAME

#copy info files
for I_DIR in AUTHORS COPYING CREDITS; do
  cp -va $SRC_DIR/$I_DIR $DST_DIR/
done


SRC_DIR=$EXT_SRC
DST_DIR=$EXT_DIRNAME

#copy common files
for I_DIR in background.html background.js jsuri.js mime.js options.html options.js sw-cube.png sw-cube-small.png ; do
  cp -va $SRC_DIR/$I_DIR $DST_DIR/
done


cp -va $SRC_DIR/manifest.json $DST_DIR/


for I_DIR in lib; do
  mkdir -pv $DST_DIR/$I_DIR
  tar --exclude 'original' -cf - -C $SRC_DIR/$I_DIR .|tar -xf - -C $DST_DIR/$I_DIR
done

