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
        return 'normal';
    }

    function getSort() {
        return 307;
    }

    function connectTo($mode) {
        $this->Lexer->addEntryPattern('<data.*?>(?=.*?</data>)',$mode,'plugin_data_display');
    }

    function postConnect() {
        $this->Lexer->addExitPattern('</data>','plugin_data_display');
    }

    function handle($match, $state, $pos, &$handler){
        switch ($state) {
            case DOKU_LEXER_UNMATCHED:
                $data = array();
                $data["data"] = $match;
                return array($state, $data);
            default:
                return array($state);
        }
    }

    function render($mode, &$renderer, $indata) {
        if($mode != 'xhtml') return false;

        list($state, $data) = $indata;

        switch ($state) {
            case DOKU_LEXER_UNMATCHED:
                if (array_key_exists("data", $data)) {
                    $options = Zend_Json::decode($data["data"]);
                    if (is_array($options) && array_key_exists("_name", $options)) {
                        // If the user hasn't specified another service URL, use the
                        // default.
                        if (array_key_exists("_service_url", $options) === false) {
                            // Load the data service URL from the plugin configuration
                            // and add it to the JSON data available to the javascript
                            // that will request the data.
                            $options["_service_url"] = $this->getConf("service_url");
                            $data["data"] = Zend_Json::encode($options);
                        }

                        $renderer->doc .= "<span class='dokuwiki-data' id='{$options["_name"]}'>";

                        // Determine whether to load the data into the wiki directly or
                        // to let the javascript handle it.
                        if (array_key_exists("_render", $options) && $options["_render"]) {
                            // If loading data directly, we need to fetch the data first
                            // and then dump the JSON to the document. Javascript will
                            // check for the "_name" attribute in the JSON data. If the
                            // attribute doesn't exist, javascript will assume the data
                            // has been dumped directly.
                            $client = new Zend_Http_Client($options["_service_url"]);

                            // Remove plugin options from request data.
                            $clean_options = array();
                            foreach ($options as $key => $value) {
                                // Plugin options are all prefixed by an underscore
                                // character like "_name".
                                if (substr($key, 0, 1) != "_") {
                                    if (array_key_exists("_format", $options) &&
                                        $options["_format"] == "json") {
                                        $clean_options[$key] = Zend_Json::encode($value);
                                    }
                                    else {
                                        $clean_options[$key] = $value;
                                    }
                                }
                            }

                            $client->setParameterGet($clean_options);

                            try {
                                $response = $client->request();
                                $data = $response->getBody();
                            }
                            catch (Zend_Http_Client_Adapter_Exception $e) {
                                $data = "Request failed: {$e->getMessage()}.";
                            }

                            $renderer->doc .= $data;
                        }
                        else {
                            // If letting javascript handle data fetching, just output
                            // the plugin arguments in the span.
                            $renderer->doc .= $data["data"];
                        }

                        $renderer->doc .= "</span>";
                    }
                }
                break;
            default:
                break;
        }
        return true;
    }
}