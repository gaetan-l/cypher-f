import PageBuilder from "/js/page-builder.js";

`use strict`

var pageBuilder = new PageBuilder(`Cypher`, `http://cypher-f.com`, `/templates`, `/json/menu.json`);

pageBuilder.buildPage()
.then(() => pageBuilder.fadeIn(pageBuilder._main));