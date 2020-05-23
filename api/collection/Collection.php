<?php
  /**
   * Object representing a collection of items.
   *
   * A collection is a folder containing picture files. The
   * name of the files follows a certain pattern in order
   * to be used as a database. Depending on the collection,
   * it contains certain attributes that can then be ex-
   * tracted and displayed as the client sees fit.
   */
  class Collection {
    // Collection names
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

    /*
     * Name of the collection, used to build folder path
     */
    private $name;

    /**
     * Collection constructor.
     *
     * @param  string  name  the name of the connection,
     *                       that will be used to fetch the
     *                       corresponding folder and to
     *                       determine what kind of collec-
     *                       tion it represents
     */
    function __construct($name) {
      $this->name = $name;
    }

    /**
     * Retruns the collection in an array.
     *
     * @return  array  the collection as an array of file
     *                 names
     */
    public function toArray() {
      $path = "../../images/$this->name";
      if (is_dir($path)) {
        $allFileNamesArray = scandir($path, SCANDIR_SORT_ASCENDING);
        $allFileNamesArray = preg_grep('/^([^.])/', $allFileNamesArray); // Removes ".", ".." and hidden files
        $filteredArray = array();

        /*
         * Building regular expressions used to parse and
         * exclude collection items.
         */
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
            $filteredArray[] = $this->buildItem($fileName, $matches);
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

    /**
     * Returns the pattern used to parse file names.
     *
     * Built depending on the type of collection (photos,
     * music, etc.)
     *
     * @return  string  the pattern used to parse collec-
     *                  tion items
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

    /**
     * Returns the pattern used to exclude certain files.
     *
     * Built depending on the type of collection (photos,
     * music, etc.).
     *
     * @return  string  the pattern used to exclude col-
     *                  lection items
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

    /**
     * Returns a json object string representing one item
     * of the collection.
     *
     * Built differently depending on the type of collection
     * (photos, music, etc.).
     *
     * @param   string  fileName  name of the file corres-
     *                            ponding to the item to
     *                            build by
     * @param   array   matches   the different matches ex-
     *                            tracted via the execution
     *                            of the relevant regex on
     *                            the file name, used to
     *                            extract the various in-
     *                            formation about the item
     * @return  string            the item in json obect
     *                            string format
     */
    private function buildItem($fileName, $matches) {
      $arrayItem = [];

      switch ($this->name) {
        case self::TRAVELS:
          $arrayItem = array(
              "fileName"     => $fileName,
              self::DATE     => "$matches[1]-$matches[3]-$matches[4]",
              "readableDate" => "$matches[4]/$matches[3]/$matches[1]",
              "regroupment"  => $matches[5],
              "tags"         => $matches[6],
              self::COUNTRY  => $matches[7],
              "location"     => $matches[8],
              "description"  => $matches[9],
              "extension"    => $matches[10]
            );
          break;
      }

      return json_encode($arrayItem, JSON_FORCE_OBJECT);
    }

    /**
     * Returns the groupings that are available for this
     * type of collection.
     *
     * Note: a grouping is a property of the items of this
     * type of collection that can actually be used to sort
     * it and group it. Example if you use "country" as a
     * grouping, the groups would be France, Italy, etc.
     *
     * @return  array  an array containing the various
     *                 groupings available for this col-
     *                 lection
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