import PageBuilder    from "/js/page-builder.js";
import PageUtil       from "/js/page-util.js";
import GalleryBuilder from "/js/gallery-builder.js";

`use strict`

var pageBuilder = new PageBuilder(`Cypher`, `http://cypher-f.com`, `/templates`, `/json/menu.json`);
var galleryBuilder = new GalleryBuilder(`travels`);

pageBuilder.buildPage()
.then(() => galleryBuilder.buildGallery(document.getElementById(`gallery`), pageBuilder))
.then(() => PageUtil.fadeIn(`main`))