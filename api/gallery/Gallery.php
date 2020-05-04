<?php
  class Gallery {
    // Name of the gallery, used to build folder path
    private $name;

    function __construct($name) {
      $this->name = $name;
    }

      public function get() {
        $path = "../../images/$this->name";
        if (is_dir($path)) {
          $allFileNamesArray = scandir($path, SCANDIR_SORT_ASCENDING);
          $allFileNamesArray = preg_grep('/^([^.])/', $allFileNamesArray); // Removes ".", ".." and hidden files
          $filteredArray = array();

          // Building regular expression
          $datePattern        = "\[((19|20)\d\d)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])\]";
          $tag                = "[a-z]+(?:-[a-z]+)*";
          $regroupmentPattern = "\[($tag)?\]";
          $taglistPattern     = "\[((?:$tag)?(?:;(?:$tag))*)\]";
          $countryPattern     = "\[([a-z]{2})\]";
          $freePattern        = "\[([^\[\]]*)\]";
          $extensionPattern   = "\.(jpg|png)";
          $repetitionPattern  = "(?:\(\d+\))?";

          $fullPattern        = "/^$datePattern$regroupmentPattern$taglistPattern$countryPattern$freePattern$freePattern$repetitionPattern$extensionPattern$/";

          $exclusionPattern = "/\bexcluded|me|people|celeb\b/"; // excluding pictures with people on them

          $nbMatches = 0;
          $nbIgnored = 0;
          $nbTotal   = 0;
          foreach ($allFileNamesArray as $fileName) {
            $matches = array();
            $doMatch = preg_match($fullPattern, $fileName, $matches);

            $tags = $matches[6];
            $excluded = preg_match($exclusionPattern, $tags);

            if ($doMatch && !$excluded) {
              $filteredArray[] = json_encode(array(
                "fileName"    => $fileName,
                "date"        => "$matches[4]/$matches[3]/$matches[1]",
                "regroupment" => $matches[5],
                "tags"        => $matches[6],
                "country"     => $matches[7],
                "location"    => $matches[8],
                "description" => $matches[9],
                "extension"   => $matches[10]
              ), JSON_FORCE_OBJECT);
              $nbMatches += 1;
            }
            else {
              $nbIgnored += 1;
            }
            $nbTotal += 1;
          }

          return $filteredArray;
        }
        else {
          return false;
        }
      }
  }
?>