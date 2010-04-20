<?php
/**
 * DokuWiki Plugin data (Syntax Component)
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author  John Huddleston <huddlej@gmail.com>
 */

// must be run within Dokuwiki
if (!defined('DOKU_INC')) die();

if (!defined('DOKU_LF')) define('DOKU_LF', "\n");
if (!defined('DOKU_TAB')) define('DOKU_TAB', "\t");
if (!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');

require_once DOKU_PLUGIN.'syntax.php';
require_once 'bootstrap.php';

class syntax_plugin_data_display extends DokuWiki_Syntax_Plugin {
    function getType() {
        return 'substition';
    }

    function getPType() {
        return 'block';
    }

    function getSort() {
        return 307;
    }

    function connectTo($mode) {
        $this->Lexer->addSpecialPattern(
            '<data>.*?</data>',
            $mode,
            'plugin_data_display'
        );
    }

    function handle($match, $state, $pos, &$handler){
        $data = array();
        preg_match('/<data>(.*?)<\/data>/', $match, $matches);

        if (count($matches) > 0) {
            $data["data"] = $matches[1];
        }

        return $data;
    }

    function render($mode, &$renderer, $data) {
        if($mode != 'xhtml') return false;

        if (array_key_exists("data", $data)) {
            $options = Zend_Json::decode($data["data"]);
            if (is_array($options) && array_key_exists("name", $options)) {
                // If the user hasn't specified another service URL, use the
                // default.
                if (array_key_exists("_service_url", $options) === false) {
                    // Load the data service URL from the plugin configuration
                    // and add it to the JSON data available to the javascript
                    // that will request the data.
                    $options["_service_url"] = $this->getConf("service_url");
                    $data["data"] = Zend_Json::encode($options);
                }
                $renderer->doc .= "<span class='dokuwiki-data' id='{$options["name"]}'>" . $data["data"] . "</span>";
            }
        }

        return true;
    }
}
