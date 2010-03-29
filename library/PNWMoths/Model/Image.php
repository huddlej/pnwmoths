<?php
/**
 * Represents an image of a particular species specimen.
 */
class PNWMoths_Model_Image extends PNWMoths_Model {
    protected static $designDoc = "moths";
    protected static $viewName = "by_species_image";

    protected $baseUrl = "http://localhost/~huddlej/getFile.php";
    protected $docId;
    protected $imageId;
    protected $attributes;

    public static function getData(array $params = array()) {
        $db = parent::getDatabase();

        if ($db === false || array_key_exists("species", $params) === false) {
            return array();
        }

        $species = Zend_Json::encode($params["species"]);
        $viewParams = array("include_docs" => 'true',
                            "key" => $species);

        try {
            $results = $db->getView(self::$designDoc, self::$viewName,
                                    $viewParams);
        }
        catch (Zend_Http_Client_Adapter_Exception $e) {
            // Return no results when the database isn't available.
            return array();
        }

        $images = array();
        foreach ($results->rows as $row) {
            // Get the last value in the array of attachment ids.
            $attachment_id = array_pop(array_keys((array)$row->doc->_attachments));
            $images[] = new PNWMoths_Model_Image($row->id, $attachment_id, (array)$row->doc);
        }

        return $images;
    }

    public function __construct($docId, $imageId, $attributes) {
        $this->docId = $docId;
        $this->imageId = $imageId;
        $this->attributes = $attributes;
    }

    public function getUrl() {
        return sprintf("%s?doc_id=%s&attachment_id=%s",
                       $this->baseUrl,
                       $this->docId,
                       $this->imageId);
    }

    public function getCaption() {
        if (array_key_exists("caption", $this->attributes)) {
            return $this->attributes["caption"];
        }
        else {
            return "";
        }
    }
}
?>