<?php
require_once 'Data.php';

/**
 * Represents a single instance of a similar species.
 */
class PNWMoths_Data_SimilarSpecies extends PNWMoths_Data {
    protected $designDoc = "moths";
    protected $viewName = "by_similar_species";

    public function getData(array $params = array()) {
        $db = $this->getDatabase();
        if (array_key_exists("species", $params) === false) {
            return array();
        }

        $species = Zend_Json::encode($params["species"]);
        $viewParams = array("include_docs" => 'true',
                            "reduce" => 'false',
                            "key" => $species);

        $results = $db->getView($this->designDoc, $this->viewName,
                                $viewParams);

//         $attachments = array();
//         foreach($results->rows as $row) {
//             foreach($row->doc->similar_species as $similar_species) {
//                 foreach($similar_species->images as $image_id) {
//                     $attachments[$image_id] = $db->getAttachment($row->id, $image_id);
//                 }
//             }
//         }
        
//         return $attachments;
        return $results->rows;
    }

    public function getAll() {
        $db = $this->getDatabase();
        $viewParams = array('group' => 'true');
        $results = $db->getView($this->designDoc, $this->viewName,
                                $viewParams);
        return $results->rows;
    }
}
?>