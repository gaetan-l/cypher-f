<?php
  include_once "HttpException.php";

  class Error404 extends HttpException {
    public function __construct($message = null, $code = 0, Exception $previous = null){
      parent::__construct($message, 404, $previous);
    }
  }
?>