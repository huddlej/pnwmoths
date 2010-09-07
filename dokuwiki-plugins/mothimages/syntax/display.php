<?php
/**
 * DokuWiki Plugin mothimages (Syntax Component)
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author  John Huddleston <huddlej@gmail.com>
 */

// must be run within Dokuwiki
if (!defined('DOKU_INC')) die();

if (!defined('DOKU_LF')) define('DOKU_LF', "\n");
if (!defined('DOKU_TAB')) define('DOKU_TAB', "\t");
if (!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');

require_once(DOKU_PLUGIN.'syntax.php');
require_once 'bootstrap.php';

class syntax_plugin_mothimages_display extends DokuWiki_Syntax_Plugin {

    function getInfo() {
        return confToHash(dirname(__FILE__).'/../plugin.info.txt');
    }

    function getType() {
        return 'substition';
    }

    function getPType() {
        return 'normal';
    }

    function getSort() {
        return 305;
    }

    function connectTo($mode) {
        $this->Lexer->addSpecialPattern("{{mothimages>[^}]+?}}",$mode,'plugin_mothimages_display');
    }

    function handle($match, $state, $pos, &$handler){
        $data = array();
        preg_match('/\{\{mothimages>([^}]+?)\}\}/', $match, $matches);

        if (count($matches) > 0) {
            $data["species"] = $matches[1];
            $species = Zend_Json::encode($data["species"]);
            $list_design_doc = "moths";
            $list_name = "images";
            $view_name = "by_species_image";
            $view_design_doc = "";
            $params = array(
                "include_docs" => 'true',
                "key" => $species,
                "image_url" => $this->getConf("image_url")
            );

            $db = PNWMoths_Model::getDatabase();
            $response = $db->getList(
                $list_design_doc,
                $list_name,
                $view_name,
                $view_design_doc,
                $params
            );
            $data["data"] = $response->getBody();

            $params["limit"] = 1;
            $response = $db->getList(
                $list_design_doc,
                $list_name,
                $view_name,
                $view_design_doc,
                $params
            );
            $data["first_image"] = $response->getBody();
        }

        return $data;
    }

    function render($mode, &$renderer, $data) {
        if($mode != 'xhtml') return false;

        $renderer->doc .= "<div id='images'>";
        $renderer->doc .= "<div id='current-image'>{$data["first_image"]}</div>";
        $renderer->doc .= "<ul id='other-images' class='jcarousel-skin-tango'>";
        $renderer->doc .= $data["data"];
        $renderer->doc .= "</ul>";
        $renderer->doc .= "</div>";
        return true;
    }
}