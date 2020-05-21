import PageBuilder from "/js/page-builder.js";
import PageUtil    from "/js/page-util.js";

`use strict`

var pageBuilder = new PageBuilder(`Cypher`, `http://cypher-f.com`, `/templates`, `/json/menu.json`);

pageBuilder.buildPage()
.then(() => PageUtil.fadeIn(`main`));