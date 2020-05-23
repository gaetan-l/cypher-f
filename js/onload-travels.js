import PageBuilder           from "/js/page-builder.js";
import PageUtil              from "/js/page-util.js";
import CollectionViewBuilder from "/js/collection-view-builder.js";

`use strict`

var pageBuilder = new PageBuilder(`Cypher`, `http://cypher-f.com`, `/templates`, `/json/menu.json`);
var cvBuilder = new CollectionViewBuilder(`travels`);

load();

async function load() {
  await pageBuilder.buildPage();
  await cvBuilder.drawView(CollectionViewBuilder.GALLERY(), document.getElementsByClassName(`collection-view`)[0]);
  PageUtil.fadeIn(`main`);
}