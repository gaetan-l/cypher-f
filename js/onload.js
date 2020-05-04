import PageBuilder from "/js/page-builder.js";

`use strict`

var pageBuilder = new PageBuilder();

pageBuilder.buildPage()
.then(() => pageBuilder.fadeIn(pageBuilder._main));