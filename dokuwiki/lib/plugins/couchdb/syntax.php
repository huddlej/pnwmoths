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
        $this->Lexer->addSpecialPattern(
            '<couchdb>.*?</couchdb>',
            $mode,
            'plugin_couchdb'
        );
    }

    function handle($match, $state, $pos, &$handler){
        $data = array();
        $data = array();
        preg_match('/<couchdb>(.*?)<\/couchdb>/', $match, $matches);

        if (count($matches) > 0) {
            $data["url"] = $matches[1];
            $client = new Zend_Http_Client($data["url"]);
            $data["data"] = $client->request()->getBody();
        }

        return $data;
    }

    function render($mode, &$renderer, $data) {
        if($mode != 'xhtml') return false;

        if (array_key_exists("data", $data)) {
            $renderer->doc .= $data["data"];
        }

        return true;
    }
}