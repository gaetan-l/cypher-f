import PageBuilder from "/js/page-builder.js";
import PageUtil    from "/js/page-util.js";

`use strict`

const pageBuilder = new PageBuilder(`Cypher`, `http://cypher-f.com`);

load();

async function load() {
  await pageBuilder.asyncBuildPage();
  PageUtil.fadeIn(`main`);
}