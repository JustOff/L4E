@echo off
set VER=1.0.8

sed -i -E "s/version>.+?</version>%VER%</" install.rdf
sed -i -E "s/version>.+?</version>%VER%</; s/download\/.+?\/location-4-evar-.+?\.xpi/download\/%VER%\/location-4-evar-%VER%\.xpi/" update.xml

set XPI=location-4-evar-%VER%.xpi
if exist %XPI% del %XPI%
zip -r9q %XPI% * -x .git/* .gitignore update.xml LICENSE LICENSE.txt README.md *.cmd *.xpi *.exe
