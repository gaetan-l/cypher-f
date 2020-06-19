import PageBuilder     from "/js/page-builder.js";
import PageUtil        from "/js/page-util.js";
import CollViewBuilder from "/js/coll-view-builder.js";
import {DisplayMode}   from "/js/coll-util.js";

`use strict`

const pageBuilder = new PageBuilder(`Cypher`, `https://cypher-f.com`);
const cvBuilder = new CollViewBuilder(`media`, pageBuilder);

load();

async function load() {
  await pageBuilder.asyncBuildPage();
  await cvBuilder.asyncDrawAll(document.getElementById(`collection-view`), DisplayMode.STACKED_GALLERY);
}