<?php
// TODO: mark items as questionable depending on a specific column in the imported csv
require_once '../www/bootstrap.php';

class Importer {
    protected $protected_collections = array("RBC");

    public function __construct($file_name, $db_name) {
        $this->file_name = $file_name;
        $this->db_name = $db_name;
        $this->db = $this->initialize_db();
    }

    public function import() {
        $docs = $this->build_docs_from_csv($this->file_name);

        // Add documents to the database.
        if (count($docs) > 0)
        {
            print "Sending " . count($docs) . " docs to database.\n";
            $response = $this->db->saveBulk(array_values($docs));

            $successes = array();
            $errors = array();
            foreach ($response as $document) {
                if (property_exists($document, "error")) {
                    $errors[] = $docs[$document->id];
                }
                else {
                    $successes[] = $document->id;
                }
            }

            print "Saved " . count($successes) . " docs.\n";
            print "Failed to save " . count($errors) . " docs. The first 10 failures follow:\n";
            print_r(array_slice($errors, 0, 10));
        }
    }

    protected function initialize_db() {
        $couchdb = new Tillikum_CouchDb("http://huddlej:Heyjude@localhost:5984");

        // Check for an existing database and create the database if it doesn't
        // exist yet.
        try {
            $response = $couchdb->get($this->db_name);
        }
        catch (Tillikum_CouchDb_Exception $e) {
            $response = $couchdb->put($this->db_name);
        }

        return new Tillikum_CouchDb_Database($couchdb, $this->db_name);
    }

    protected function build_docs_from_csv($file_name) {
        $handle = fopen($file_name, "r");

        $rows = array();
        while (($data = fgetcsv($handle)) !== false)
        {
            $rows[] = $data;
        }
        fclose($handle);

        print "Found " . count($rows) . " rows.\n";

        $column_names = array_shift($rows);
        $field_types = array(
            "elevation" => "integer",
            "longitude" => "float",
            "latitude" => "float"
        );
        $notes_index = array_search("notes", $column_names);

        $documents = array();
        $i = 0;
        while (count($rows) > 0)
        {
            $row = array_pop($rows);
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

                if (array_key_exists($column_name, $field_types))
                {
                    switch ($field_types[$column_name]) {
                        case "integer":
                            $row_value = (int)$row_value;
                            break;
                        case "float":
                            $row_value = (float)$row_value;
                            break;
                        default:
                            break;
                    }
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
                $measurement = new Zend_Measure_Length(
                    $document["elevation"],
                    Zend_Measure_Length::METER
                );
                $measurement = $measurement->convertTo(Zend_Measure_Length::FEET, 0);

                // convertTo returns a localized string with units. Taking the
                // first part of the string gets the actual
                // measurement. Replacing the commas gets an integer value from
                // the string.
                list($measurement, $units) = explode(" ", $measurement);
                $measurement = str_replace(",", "", $measurement);

                $document["elevation"] = $measurement;
                $document["elevation_units"] = "ft.";
            }

            // Mark protected documents.
            if (array_key_exists("collection", $document) &&
                in_array($document["collection"], $this->protected_collections)) {
                $document["is_protected"] = true;
            }

            // Create a unique document id for this document based on these
            // unique fields. This will catch attempts to upload duplicate
            // records from overlapping datasets.
            $unique_fields = array(
                "genus",
                "species",
                "latitude",
                "longitude",
                "year",
                "month",
                "day",
                "collector",
                "collection"
            );
            $id_inputs = array();
            foreach ($unique_fields as $unique_field) {
                if (array_key_exists($unique_field, $document)) {
                    $id_inputs[] = $document[$unique_field];
                }
            }

            // If no values exist for any of the unique fields, let the database
            // assign an id for this document.
            if (count($id_inputs) > 0) {
                // Create the unique id by calculating the SHA-1 hash for the
                // concatenated values for each unique field.
                $document["_id"] = sha1(implode("", $id_inputs));
            }
            else {
                print "Couldn't create an id for " . print_r($document, true);
            }

            if (count($document) > 0)
            {
                $documents[$document["_id"]] = new Tillikum_CouchDb_Document($document);
            }

            $i++;
        }

        return $documents;
    }
}

if (count($argv) < 3) {
    print "Usage: {$SERVER['SCRIPT_NAME']} <csv file> <dbname>\n";
    exit;
}

$file_name = $argv[1];
$db_name = $argv[2];
print "Importing $file_name into $db_name.\n";
$importer = new Importer($file_name, $db_name);
$importer->import();
?>
