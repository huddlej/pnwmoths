<?php
/**
 * DokuWiki Plugin couchdb (Syntax Component)
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

class syntax_plugin_couchdb extends DokuWiki_Syntax_Plugin {
    function getType() {
        return 'substition';
    }

    function getPType() {
        return 'normal';
    }

    function getSort() {
        return 800;
    }

    function connectTo($mode) {
        $this->Lexer->addEntryPattern('<couchdb.*?>(?=.*?</couchdb>)',$mode,'plugin_couchdb');
    }

    function postConnect() {
        $this->Lexer->addExitPattern('</couchdb>','plugin_couchdb');
    }

    function handle($match, $state, $pos, &$handler){
        switch ($state) {
            case DOKU_LEXER_UNMATCHED:
                $json = Zend_Json::decode($match);
                $url = sprintf("%s%s", $this->getConf("couchdb_url"), $json["url"]);
                $client = new Zend_Http_Client();
                $client->setUri($url)->setParameterGet($json["params"]);
                try {
                    $data = $client->request()->getBody();
                }
                catch (Zend_Http_Client_Adapter_Exception $e) {
                    $data = "The database is not running. Please contact the system administrator.";
                }
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
                $renderer->doc .= $data;
                break;
            default:
                break;
        }

        return true;
    }
}