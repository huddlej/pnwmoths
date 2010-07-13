<?php
/**
 * DokuWiki Plugin similarspecies (Syntax Component)
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

class syntax_plugin_similarspecies_edit extends DokuWiki_Syntax_Plugin {

    function getInfo() {
        return confToHash(dirname(__FILE__).'/../plugin.info.txt');
    }

    function getType() {
        return 'substition';
    }

    function getPType() {
        return 'block';
    }

    function getSort() {
        return 305;
    }

    function connectTo($mode) {
        $this->Lexer->addSpecialPattern("{{similarspecies-edit}}",$mode,'plugin_similarspecies_edit');
    }

    function handle($match, $state, $pos, &$handler){
        $data = array();
        return $data;
    }

    function render($mode, &$renderer, $data) {
        if($mode != 'xhtml') return false;

        function not_empty($value) {
            return empty($value) == false ? true : false;
        }

        if (array_key_exists("species", $_POST) &&
            array_key_exists("similar_species", $_POST)) {
            $species = $_POST["species"];
            $similar_species = array_map("trim", explode("\n", $_POST["similar_species"]));
            $similar_species = array_filter($similar_species, "not_empty");

            PNWMoths_Model_SimilarSpecies::setSimilarSpecies($species, $similar_species);

            $renderer->doc .= "<p><em>Your changes have been saved.</em></p>";
        }

        if (array_key_exists("species", $_GET)) {
            // Display form to edit similar species if a species is specified.
            $species = $_GET["species"];
            $similar_species = PNWMoths_Model_SimilarSpecies::getSimilarSpecies($species);
            $similar_species = implode("\n", $similar_species);
            $renderer->doc .= <<<HTML
<p><a href="?">Back to Similar Species</a></p>
<form method="post" action="">
<fieldset>
    <legend>Species similar to {$species}</legend>
    <p>
        <textarea name="similar_species">{$similar_species}</textarea>
        <input type="hidden" name="species" value="{$species}" />
    </p>
    <p><input type="submit" value="Save" /></p>
</form>
HTML;
        }
        else {
            // Get list of similar species from the database.
            $species = PNWMoths_Model_SimilarSpecies::getSpecies();

            // Display list of species.
            if (count($species) > 0) {
                $renderer->doc .= "<ul>";

                foreach($species as $row) {
                    $renderer->doc .= <<<HTML
<li><a href="?species={$row->key}">{$row->key}</a> ({$row->value} records)</li>
HTML;
                }

                $renderer->doc .= "</ul>";
            }
            else {
                $renderer->doc .= "<p>No similar species found.</p>";
            }
        }

        return true;
    }
}