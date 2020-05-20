# cypher-f

Personnal website displaying travels, hobbies, favorite lists, etc.

## ToDo list

### Gallery grouping
- ~~*js/gallery-builder.js*: **Create grouped galleries** using *null* + optional groupings passed as parameters, standard behavior should continue functioning even when no grouping is passed~~
- *css/structure.css, css/styles.css*: **Display grouped gallery** with **sticky group headers**
- ~~*css/structure.css, css/styles.css*: **Fixed margins** between pitures~~
- *js/gallery-builder.js*: **Group and order selector**

### Gallery search and tag function
- *js/gallery-builder.js*: **Search bar** dynamically hiding irrelevant images in gallery
- *js/gallery-builder.js*: **Advanced search parser** allowing to specify which information to search (tag, location, description, etc.)
- *js/gallery-builder.js*: **Tags bar** displaying all image tags and allowing to select which ones to display

### Translation
- *js/gallery-builder.js*: Replace raw country code with **curly-bracketed country code** to allow for translation
- *js/onload-travels.js*: **Second call to translator** after main section is loaded to translate specific elements like country

### Utilities
- Add **windows-install section** with programs to install on a fresh Windows install, grouped by type, and an interface to select which ones to **download in one click**
- Add a **links section** with my favorite web links and an inteface to **select and export links** in Chrome and Firefox format

### Presentation
- *js/page-builder.js*: **Collapsable side menu**
- *css/structure.css, css/styles.css*: Improved **responsive design**

### Site template update and cleanup
- ~~*json/menu.json*: Remove **irrelevent items** in the menu~~
- *json/menu.json*: Add **favorite** item with dedicated gallery
- *json/menu.json*: Add ***Tears in Rain* Universe** item with a link to future dedicated subdomain

### Login and logged user functions
- *js/*: Add **login feature** and allow private pages display only if connected
- *js/gallery-builder.js*: Add **image upload form** to upload images with informations in any gallery
- *js/gallery-builder.js*: Add **gallery page edit mode** to allow for information edition

### Misc functions
- *js/page-builder.js*: **Parametrize add-button function** so that a container can be specified to adapt to different page structures
- *js/page-builder.js*: Add **download pdf option**, which is activated when an index.pdf file is present in the same folder as the web page, if so, it adds an icon on the page to download it in PDF format

### Code cleanup
- **Naming**: builder/drawer, gallery/directory, etc.