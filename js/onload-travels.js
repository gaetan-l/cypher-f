import PageBuilder from "/js/page-builder.js";
import GalleryBuilder from "/js/gallery-builder.js";

`use strict`

var pageBuilder = new PageBuilder();
var galleryBuilder = new GalleryBuilder(`travels`);

pageBuilder.buildPage()
.then(() => galleryBuilder.buildGallery(document.getElementById(`gallery`), pageBuilder))
.then(() => pageBuilder.fadeIn(pageBuilder._main))