#!/bin/bash

siteAddress=1MQveQ3RPpimXX2wjW2geAGkNJ1GdXkvJ3
zeronetInstall=../../Documents/zeronet

# Build the site for production
yarn build:prod

# Copy generated files over
#cp dist/index.html $zeronetInstall/data/$siteAddress/
cp dist/all.js $zeronetInstall/data/$siteAddress/js/

# Sign and publish the site
cd ../../Documents/zeronet
python ./zeronet.py siteSign $siteAddress
python ./zeronet.py sitePublish $siteAddress > /dev/null 2>&1 &
cd -
