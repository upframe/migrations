OUT_DIR=diagram/tmp
rm -rf $OUT_DIR && mkdir $OUT_DIR
ZIP_FILE="${OUT_DIR}/crawl.zip"
wget https://github.com/schemacrawler/SchemaCrawler/releases/download/v16.11.1/schemacrawler-16.11.1-distribution.zip -O $ZIP_FILE
unzip $ZIP_FILE -d $OUT_DIR
