<?php
// TODO: merge state into county name when storing in the database.
// TODO: calculate latitude/longitude precision and store it in a field
// TODO: calculate sortable date and store it
// TODO: mark Royal British Columbia (RBC) data as sensitive
include("Tillikum/CouchDB.php");
include("Zend/Json.php");

function load_data($db, $file_name)
{
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
        $resp = $db->saveBulk($documents);
        print_r($resp);
    }
}

$db_name = "pnwmoths";
$couchdb = new Tillikum_CouchDb("http://localhost:5984");
$couchdb->delete($db_name);
$couchdb->put($db_name);

$db = new Tillikum_CouchDb_Database($couchdb, $db_name);
load_data($db, "moths.csv");

// Run the by_species view to build the index.
$params = array("key" => Zend_Json::encode("Autographa californica"));
$view = $db->getView("moths", "by_species", $params);
print "Found " . count($view->rows) . " rows in the view.";
?>
