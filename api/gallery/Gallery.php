<?php
  class Gallery {
    // Gallerie names
    const TRAVELS = "travels";

    // Groupings
    const DATE = "date";
    const COUNTRY = "country";

    // Patterns
    const DATE_PATTERN        = "\[((19|20)\d\d)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])\]";
    const TAG_PATTERN         = "[a-z]+(?:-[a-z]+)*";
    const REGROUPMENT_PATTERN = "\[(" . self::TAG_PATTERN . ")?\]";
    const TAGLIST_PATTERN     = "\[((?:" . self::TAG_PATTERN . ")?(?:;(?:" . self::TAG_PATTERN . "))*)\]";
    const COUNTRY_PATTERN     = "\[([a-z]{2})\]";
    const FREE_PATTERN        = "\[([^\[\]]*)\]";
    const EXTENSION_PATTERN   = "\.(jpg|png)";
    const REPETITION_PATTERN  = "(?:\(\d+\))?";

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

        // Building regular expressions
        $fullPattern      = $this->buildParsePattern();
        $exclusionPattern = $this->buildExclusionPattern();

        $nbMatches = 0;
        $nbIgnored = 0;
        $nbTotal   = 0;
        foreach ($allFileNamesArray as $fileName) {
          $matches = array();
          $doMatch = preg_match($fullPattern, $fileName, $matches);

          $tags = $matches[6];
          $excluded = preg_match($exclusionPattern, $tags);

          if ($doMatch && !$excluded) {
            $filteredArray[] = $this->buildJsonItem($fileName, $matches);
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

    /*
     * Returns the pattern used to parse file names, built
     * depending on the type of gallery (photos, music,
     * etc.)
     */
    private function buildParsePattern() {
      $pattern = "";
      switch ($this->name) {
        case self::TRAVELS:
          $pattern = "/^" . self::DATE_PATTERN . self::REGROUPMENT_PATTERN . self::TAGLIST_PATTERN . self::COUNTRY_PATTERN . self::FREE_PATTERN . self::FREE_PATTERN . self::REPETITION_PATTERN . self::EXTENSION_PATTERN . "$/";
          break;
      }

      return $pattern;
    }

    /*
     * Returns the pattern used to exclude certain files,
     * built depending on the type of gallery (photos,
     * music, etc.)
     */
    private function buildExclusionPattern() {
      $pattern = "";
      switch ($this->name) {
        case self::TRAVELS:
          $pattern = "/\bexcluded|me|people|celeb\b/"; // excluding pictures with people on them
          break;
      }

      return $pattern;
    }

    /*
     * Returns a JSON object representing one item of the
     * gallery, built differently depending on the type of
     * gallery (photos, music, etc.)
     */
    private function buildJsonItem($fileName, $matches) {
      $arrayItem = [];

      switch ($this->name) {
        case self::TRAVELS:
          $arrayItem = array(
              "fileName"    => $fileName,
              self::DATE    => "$matches[4]/$matches[3]/$matches[1]",
              "regroupment" => $matches[5],
              "tags"        => $matches[6],
              self::COUNTRY => $matches[7],
              "location"    => $matches[8],
              "description" => $matches[9],
              "extension"   => $matches[10]
            );
          break;
      }

      return json_encode($arrayItem, JSON_FORCE_OBJECT);
    }

    /*
     * Returns the groupings that are available for this
     * type of gallery
     */
    public function getAvailableGroupings() {
      $groupingsArray = [];

      switch ($this->name) {
        case self::TRAVELS:
          $groupingsArray = array(self::DATE, self::COUNTRY);
          break;
      }

      return $groupingsArray;
    }
  }
?>