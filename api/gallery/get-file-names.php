<?php
  header("Access-Control-Allow-Origin: *");
  header("Content-Type: application/json; charset=UTF-8");
  header("Access-Control-Allow-Methods: GET");

  try {
    include_once "../Error400.php";
    include_once "../Error404.php";
    include_once "Gallery.php";

    if (!empty($_GET["name"])) {
      // Retrieving gallery name from URL
      $name = htmlspecialchars($_GET["name"]);
      $galleryObject = new Gallery($name);
      $gallery = $galleryObject->get();
      $availableGroupings = $galleryObject->getAvailableGroupings();

      if (!($gallery === false)) {
        http_response_code(200);
        echo json_encode(array(
          "message" => "Gallery $name found.",
          "content" => $gallery,
          "extra"   => array("availableGroupings" => $availableGroupings)
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
      "line"    => $e-> getLine(),
      "trace"   => $e->getTrace()
    ));
  }
?>