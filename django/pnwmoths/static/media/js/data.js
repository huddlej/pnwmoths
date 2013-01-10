//<![CDATA[
var server_address = "http://localhost:5984/pnwmoths/";
var view_address = server_address + "_design/moths/_view/";

// TODO: getSites should take a url parameter before the species name parameter.
function getSites(species_name) {
  var url = view_address + "by_species/";
  //var url = "http://www.biol.wwu.edu/~huddlej/index.php";

  data = {};
  if(species_name !== undefined) {
    data["key"] = "\"" + species_name + "\"";
  }

  $.getJSON(
      url,
      data,
      function(results) {
          sites = [];
          for(index in results["rows"]) {
              var row = results["rows"][index].value;
              row.prototype = new Site;
              Site.call(row);
              sites.push(row);
          }
          populateMapBySpecies(species_name);
          $("#status").text("");
          prepareLinks();
      }
  );
}

function getUniqueSpecies() {
  var url = view_address + "unique_species/";
  data = {group: true},
  $.getJSON(url, data,
            function(data) {
              unique_species = [];
              for(index in data["rows"]) {
                unique_species.push(data["rows"][index].key);
              }
              prepareLinks();
            });
}

function getDataByCoordinates() {
  var url = view_address + "by_coordinates/";
  data = {group: true},
  $.getJSON(url, data,
            function(data) {
              coordinates = {};
              for(index in data["rows"]) {
                coordinates[data["rows"][index].key] = data["rows"][index].value;
              }
            });
}
//]]>
