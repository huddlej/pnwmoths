<?php
// TODO: use Tillikum_CouchDb instead of CouchSimple.
// TODO: merge state into county name when storing in the database.
// TODO: calculate latitude/longitude precision and store it in a field
// TODO: calculate sortable date and store it
// TODO: remove pushing of views because we have couchapp now
include("CouchSimple.php");
include("JSON.php");

$options = array("host" => "localhost",
                 "port" => 5984);
$couch = new CouchSimple($options);

// Future-friendly json_encode
if(!function_exists('json_encode'))
{
    function json_encode($data)
    {
        $json = new Services_JSON();
        return $json->encode($data);
    }
 }

// Future-friendly json_decode
if (!function_exists('json_decode'))
{
    function json_decode($data)
    {
        $json = new Services_JSON();
        return $json->decode($data);
    }
}

function create_db()
{
    global $couch;
    print "Creating database\n";
    $resp = json_decode($couch->send("PUT", "/pnwmoths/"));
    print_r($resp);
}

function delete_db()
{
    global $couch;
    print "Deleting database\n";
    $resp = json_decode($couch->send("DELETE", "/pnwmoths/"));
    print_r($resp);
}

function add_views()
{
    global $couch;

    print "Checking for existing views\n";
    $resp = json_decode($couch->send("GET", "/pnwmoths/_design/moths"));

    // If there wasn't a "not found" error while fetching the views, delete the
    // views.
    if (empty($resp->error) || $resp->error != "not_found")
    {
        $revision = $resp->_rev;
        print "Deleting existing views (rev $revision)\n";
        $resp = json_decode($couch->send("DELETE", "/pnwmoths/_design/moths?rev=$revision"));
        print_r($resp);
    }

    print "Adding views\n";
    $design_doc = array("_id" => "_design/moths",
                        "language" => "javascript",
                        "views" => array("by_species" => array("map" => 'function(doc) {
 if(doc.elevation) {
   doc.elevation = parseInt(doc.elevation);
 }
 else {
   doc.elevation = "";
 }

 var longitude_precision = 0;
 var latitude_precision = 0;
 if(doc.longitude) {
   try {
     longitude_precision = doc.longitude.split(".")[1].length;
   }
   catch (e) {
   }
   doc.longitude = Number(doc.longitude).toFixed(1);
 }

 if(doc.latitude) {
   try {
     latitude_precision = doc.latitude.split(".")[1].length;
   }
   catch (e) {
   }
   doc.latitude = Number(doc.latitude).toFixed(1);
 }

 doc.precision = Math.min(longitude_precision, latitude_precision);
 doc.site_name = doc.city;
 emit(doc.genus + " " + doc.species, doc);
}'),
                                         "unique_species" => array("map" => 'function(doc) {
 emit(doc.genus + " " + doc.species, doc);
}',
                                                                   "reduce" => 'function(keys, values) {
 return null;
}')
));
    $json_design_doc = json_encode($design_doc);
    $resp = $couch->send("PUT", "/pnwmoths/_design/moths", $json_design_doc);
    print_r($resp);
}

function load_data($file_name)
{
    global $couch;
    $feet_per_meter = 3.2808399;
    print "Loading data\n";
    $handle = fopen($file_name, "r");

    $rows = array();
    while (($data = fgetcsv($handle, 2000, ",")) !== false)
    {
        $rows[] = $data;
    }
    fclose($handle);

    $column_names = array("id", "family", "genus", "species", "longitude", "latitude",
                          "state", "county", "city", "elevation", "elevation_units",
                          "year", "month", "day", "collector", "collection", "males",
                          "females", "notes");
    $db_name = "pnwmoths";
    $uri = implode("", array("/", $db_name, "/"));
    $headers = array("Content-type" => "application/json");
    $integer_fields = array("elevation");
    $notes_index = array_search("notes", $column_names);

    print "Building documents array\n";
    $documents = array();
    for ($i = 0; $i < count($rows); $i++)
    {
        $row = $rows[$i];
        $document = array();
        for ($j = 0; $j < count($row); $j++)
        {
            // Only store an attribute in the document if it has a value.
            $row_value = trim($row[$j]);
            if ($row_value == "")
            {
                continue;
            }

            // All fields with an index higher than the notes field are treated as
            // additional notes fields.
            if ($j > $notes_index)
            {
                $column_name = "notes";
            }
            else
            {
                $column_name = $column_names[$j];
            }

            if (in_array($column_name, $integer_fields))
            {
                $row_value = (int)$row_value;
            }

            if (in_array($column_name, $document) == false)
            {
                $document[$column_name] = $row_value;
            }
            else
            {
                // Concatenate existing fields with line returns.
                $document[$column_name] = implode("\n", array($document[$column_name], $row_value));
            }
        }

        // Convert meters to feet.
        if (array_key_exists("elevation_units", $document) &&
            $document["elevation_units"] == "m.")
        {
            $document["elevation"] = $document["elevation"] * $feet_per_meter;
            $document["elevation_units"] = "ft.";
        }

        if (count($document) > 0)
        {
            $documents[] = $document;
        }
    }

    if (count($documents) > 0)
    {
        // Add document to the database.
        print "Sending bulk docs to database\n";
        $documents = array("docs" => $documents);
        $resp = $couch->send("POST", "/pnwmoths/_bulk_docs", json_encode($documents));
        print substr($resp, 0, 2000) . "\n";
    }
}

function show_all_docs()
{
    global $couch;
    $resp = $couch->send("GET", "/pnwmoths/_all_docs");
    print_r($resp);
}

delete_db();
create_db();
add_views();
load_data("moths.csv");
//show_all_docs();

// // Run the by_species view to build the index.
$key = urlencode("Autographa californica");
$query = "/pnwmoths/_design/moths/_view/by_species/?key=\"$key\"";
$resp = $couch->send("GET", $query);
print "Response was " . strlen($resp) . " characters long.";
?>
