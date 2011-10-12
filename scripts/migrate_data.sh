# Download species records.
fetch -o speciesrecords.json "http://pnwmoths.biol.wwu.edu:5984/pnwmoths/_design/moths/_view/speciesrecord?include_docs=true"

# Download species labels.
fetch -o specieslabels.json "http://pnwmoths.biol.wwu.edu:5984/pnwmoths/_design/moths/_view/specieslabel?include_docs=true"

# Download similar species.
fetch -o similarspecies.json "http://pnwmoths.biol.wwu.edu:5984/pnwmoths/_design/moths/_view/similar_species?include_docs=true"
