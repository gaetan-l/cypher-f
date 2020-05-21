<?php
  header("Access-Control-Allow-Origin: *");
  header("Content-Type: application/json; charset=UTF-8");
  header("Access-Control-Allow-Methods: GET");

  try {
    include_once "../Error400.php";
    include_once "../Error404.php";
    include_once "Collection.php";

    if (!empty($_GET["name"])) {
      /*
       * Retrieving gallery name from url parameters.
       */
      $name = htmlspecialchars($_GET["name"]);

      /*
       * Creating Collection object.
       */
      $collection = new Collection($name);

      /*
       * If collection is created correctly, retrieving ar-
       * ray content and extra information and encoding
       * everything in json format. Main content is placed
       * in "content" variable, the rest is in an array in
       * variable "extra".
       */
      if (!($collection === false)) {
        http_response_code(200);
        echo json_encode(array(
          "message" => "Gallery $name found.",
          "content" => $collection->toArray(),
          "extra"   => array("availableGroupings" => $collection->getAvailableGroupings())
        ));
      }
      else {
        throw new Error404("Gallery $name not found.");
      }
    }
    else {
      throw new Error400("Gallery name mandatory.");
    }
  }
  catch(Exception $e) {
    http_response_code($e->getCode());
    echo json_encode(array(
      "message" => $e->getMessage(),
      "file"    => $e->getFile(),
      "line"    => $e->getLine(),
      "trace"   => $e->getTrace()
    ));
  }
?>