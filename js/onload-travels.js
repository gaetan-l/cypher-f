import PageBuilder     from "/js/page-builder.js";
import PageUtil        from "/js/page-util.js";
import CollViewBuilder from "/js/coll-view-builder.js";
import {DisplayMode}   from "/js/coll-util.js";

`use strict`

var pageBuilder = new PageBuilder(`Cypher`, `http://cypher-f.com`, `/templates`, `/json/menu.json`);
var cvBuilder = new CollViewBuilder(`travels`, pageBuilder);

load();

async function load() {
  await pageBuilder.buildPage();
  await cvBuilder.asyncDrawAll(document.getElementById(`collection-view`));
}