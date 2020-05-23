import PageBuilder from "/js/page-builder.js";
import PageUtil    from "/js/page-util.js";

`use strict`

var pageBuilder = new PageBuilder(`Cypher`, `http://cypher-f.com`, `/templates`, `/json/menu.json`);

load();

async function load() {
  await pageBuilder.buildPage();
  PageUtil.fadeIn(`main`);
}