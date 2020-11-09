sh $(ls -d diagram/tmp/*/|head -n 1)_schemacrawler/schemacrawler.sh \
  --command=schema \
  --portable-names=true \
  --output-format=png \
  --output-file=upframe_latest.png \
  --info-level=maximum \
  --server=postgresql \
  --database=upframe \
  --user=postgres \
  --password=postgres
