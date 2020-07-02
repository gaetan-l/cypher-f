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
    const PHOTOS        = "photos";
    const FAVORITES     = "favorites";
    const COLLECTIONS   = array(self::PHOTOS, self::FAVORITES);

    // Attributes
    const COUNTRY       = "country";
    const DATE          = "date";
    const DESCRIPTION   = "description";
    const EXTENSION     = "extension";
    const FILE_NAME     = "fileName";
    const LOCATION      = "location";
    const NAME          = "name";
    const READABLE_DATE = "readableDate";
    const TAGS          = "tags";
    const TYPE          = "type";
    const YEAR          = "year";

    // Patterns
    const DATE_PATTERN        = "\[((19|20)\d\d)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])\]";
    const YEAR_PATTERN        = "\[((\d{4})(?:\-(\d{4}))?)\]"; // "year" or "year-year"

    /*
     * Do not use TAG_PATTERN as-is, use SINGLE_TAG_PATTERN
     * or TAGLIST_PATTERN for capturing group.
     */
    const TAG_PATTERN         = "[a-z]+(?:-[a-z]+)*";
    const SINGLE_TAG_PATTERN  = "\[(" . self::TAG_PATTERN . ")\]";
    const TAGLIST_PATTERN     = "\[((?:" . self::TAG_PATTERN . ")?(?:;(?:" . self::TAG_PATTERN . "))*)\]";

    const COUNTRY_PATTERN     = "\[([a-z]{2})\]";
    const FREE_PATTERN        = "\[([^\[\]]*)\]";
    const REPETITION_PATTERN  = "(?:\(\d+\))?";
    const EXTENSION_PATTERN   = "\.(jpg|png)";

    // FAVORITES_FULL_PATTERN = \[((19|20)\d\d)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])\]\[([a-z]+(?:-[a-z]+)*)\]\[([^\[\]]*)\]\[([a-z]{2})\]\[((?:[a-z]+(?:-[a-z]+)*)?(?:;(?:[a-z]+(?:-[a-z]+)*))*)\]\[((\d{4})(?:\-(\d{4}))?)\]\[([^\[\]]*)\](?:\(\d+\))?\.(jpg|png)
    // PHOTO_FULL_PATTERN     = \[((19|20)\d\d)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])\]\[((?:[a-z]+(?:-[a-z]+)*)?(?:;(?:[a-z]+(?:-[a-z]+)*))*)\]\[([a-z]{2})\]\[([^\[\]]*)\]\[([^\[\]]*)\](?:\(\d+\))?\.(jpg|png)

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
     * Returns true if the gallery exists.
     *
     * @return  boolean  if the gallery exists
     */
    public function exists() {
      return in_array($this->name, self::COLLECTIONS);
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

          $tags = $matches[5];
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
        case self::FAVORITES:
          $pattern = "/^" . self::DATE_PATTERN . self::SINGLE_TAG_PATTERN . self::FREE_PATTERN . self::COUNTRY_PATTERN . self::TAGLIST_PATTERN . self::YEAR_PATTERN . self::FREE_PATTERN . self::REPETITION_PATTERN . self::EXTENSION_PATTERN . "$/";
          break;

        case self::PHOTOS:
          $pattern = "/^" . self::DATE_PATTERN . self::TAGLIST_PATTERN . self::COUNTRY_PATTERN . self::FREE_PATTERN . self::FREE_PATTERN . self::REPETITION_PATTERN . self::EXTENSION_PATTERN . "$/";
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
        case self::FAVORITES:
          $pattern = "/\bexcluded\b/";
          break;

        case self::PHOTOS:
          $pattern = "/\bexcluded\b/";
          // $pattern = "/\bexcluded|me|people|celeb\b/"; // excluding pictures with people on them
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
     *                            build
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
        case self::FAVORITES:
          $arrayItem = array(
            self::FILE_NAME     => $fileName,
            self::DATE          => "$matches[1]-$matches[3]-$matches[4]",
            self::READABLE_DATE => "$matches[4]/$matches[3]/$matches[1]",
            self::TYPE          => $matches[5],
            self::NAME          => $matches[6],
            self::COUNTRY       => $matches[7],
            self::TAGS          => $matches[8],
            self::YEAR          => $matches[9],
            self::DESCRIPTION   => $matches[12],
            self::EXTENSION     => $matches[13]
          );
          break;

        case self::PHOTOS:
          $arrayItem = array(
            self::FILE_NAME     => $fileName,
            self::DATE          => "$matches[1]-$matches[3]-$matches[4]",
            self::READABLE_DATE => "$matches[4]/$matches[3]/$matches[1]",
            self::TAGS          => $matches[5],
            self::COUNTRY       => $matches[6],
            self::LOCATION      => $matches[7],
            self::DESCRIPTION   => $matches[8],
            self::EXTENSION     => $matches[9]
          );
          break;
      }

      return json_encode($arrayItem, JSON_FORCE_OBJECT);
    }

    /**
     * Returns the attributes that are sortable for this
     * type of collection.
     *
     * @return  array  an array containing the various
     *                 sortable attributes for this col-
     *                 lection
     */
    public function getSortableAttributes() {
      $sortableAttributes = [];

      switch ($this->name) {
        case self::FAVORITES:
          $sortableAttributes = array(self::DATE, self::TYPE, self::NAME, self::COUNTRY, self::YEAR);
          break;

        case self::PHOTOS:
          $sortableAttributes = array(self::DATE, self::COUNTRY);
          break;
      }

      return $sortableAttributes;
    }
  }
?>