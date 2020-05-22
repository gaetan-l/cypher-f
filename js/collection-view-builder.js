import PageUtil from "/js/page-util.js";

`use strict`

/**
 * Helper class to build views able to display collections
 * (list, gallery, etc.).
 */
export default class CollectionViewBuilder {
  /*
   * Class "constants"
   */
   static GALLERY() {return `gallery`;}
   static DETAILS() {return `deteils`;}
   static DISPLAY_MODE() {return [CollectionViewBuilder.GALLERY(), CollectionViewBuilder.DETAILS()];}

   static ASC() {return `ASC`;}
   static DESC() {return `DESC`;}
   static DISPLAY_ORDER() {return [CollectionViewBuilder.ASC(), CollectionViewBuilder.DESC()];}

   static DATE() {return `date`;}

  /**
   * CollectionViewBuilder constructor.
   *
   * @param  name          name of the collection, used to
   *                       fetch it via the API
   */
  constructor(name) {
    this._name = name;

    /*
     * Will hold the collection once fetched via the api.
     */
    this._collection = null;

    /*
     * An array that will contain the groupings available
     * for this collection once fetched via the api.
     */
    this._availableGroupings = [];
  }

  /*
   * Returns the collection associated with this
   * CollectionViewBuilder.
   *
   * Fetches it via the api if not already loaded. 
   *
   * @access  private
   * @return  JSONObject  the collection in json format
   */
  async _getCollection() {
    if (this._collection === null) {
      var response = await fetch(`/api/collection/get-collection.php?name=${this._name}`, {method: `GET`});
      var json = await response.json();
      this._collection = json.content;
      this._availableGroupings = json.extra.availableGroupings;
    }

    return this._collection;
  }

  /**
   * Builds a view containing the collection.
   *
   * @param  PageBuilder  pageBuilder  the pageBuilder used
   *                                   to build the page
   *                                   containing the view
   * @param  string       displayMode  the type of view
   *                                   that is to be drawn
   * @param  HTMLElement  elemOrSel    the HTMLElement to
   *          or                       access or the selec-
   *         string                    tor used to access
   *                                   it
   * @param  string       order        the order of the
   *                                   items, can be `ASC`
   *                                   or `DESC`, default:
   *                                   `ASC`
   * @param  string       grouping     the grouping used to
   *                                   group the items of
   *                                   the collection, op-
   *                                   tional, default:
   *                                   null
   */
  async drawView(displayMode, elemOrSel, order = CollectionViewBuilder.ASC(), grouping = null) {
    /*
     * Checks if order and grouping are valid or reverts to
     * default. Orders and groups the collection before
     * displaying it.
     */
    grouping = this._availableGroupings.includes(grouping) ? grouping : null;
    order    = CollectionViewBuilder.DISPLAY_ORDER().includes(order) ? order : CollectionViewBuilder.ASC();
    await this._sort(order, grouping);

    var collectionView;
    switch (displayMode) {
      case CollectionViewBuilder.GALLERY():
        collectionView = await this._buildGalleryView();
        break;

      case CollectionViewBuilder.DETAILS():
        collectionView = await this._buildDetailsListView();
        break;
    }

    /*
     * Adding collection view to specified container.
     */
    var container = PageUtil.getUniqueElement(elemOrSel);
    while (collectionView.firstChild) {
      container.appendChild(collectionView.firstChild);
    }

    /*
     * Adding fullscreen view to document body.
     */
    var fsView = document.createElement(`div`);
    fsView.setAttribute(`id`, `div-fs`);
    document.body.appendChild(fsView);
    await PageUtil.replaceElementWithTemplate(`#div-fs`, `div-fs`);
    PageUtil.bindOnclick(`#btn-fs-close`,  function() {
      PageUtil.fadeOut(`#div-fs`);
    });
  }

  /**
   * Orders and groups the collection.
   *
   * @access  private
   * @param  string    order     the order of the items,
   *                             can be `ASC` or `DESC`,
   *                             default: `ASC`
   * @param   string   grouping  the grouping used to group
   *                             the items of the collec-
   *                             tion, optional, default:
   *                             null
   */
   async _sort(order, grouping) {
    await this._getCollection();
    this._collection.sort(function (x, y) {
      var jsonX = JSON.parse(x);
      var jsonY = JSON.parse(y);

      /*
       * Groupings are always sorted alphabetically no mat-
       * ter the order, except for date...
       */
      if (!((grouping === null) || (grouping === CollectionViewBuilder.DATE()))) {
        var groupX = jsonX[grouping];
        var groupY = jsonY[grouping];

        if (!(groupX === groupY)) {
          return groupX.localeCompare(groupY);
        }
      }

      /*
       * ...then items are sorted chronologically, depen-
       * ding on the order.
       */
      var dateX = Date.parse(jsonX.date);
      var dateY = Date.parse(jsonY.date);
      return (order === CollectionViewBuilder.DESC() ? dateY - dateX : dateX - dateY);
    });
   }

  /*
   * Builds a gallery view containing the collection.
   *
   * @access  private
   */
  async _buildGalleryView() {
    /*
     * Temporary container to hold the view.
     */
    var view = document.createElement(`div`);

    /*
     * Used to "bind" the CollexionViewBuilder without
     * overriding "this" which is needed in this context.
     */
    var cvb = this;
    var collection = await this._getCollection();
    for (let i = 0 ; i < collection.length ; i++) {
      /*
       * Picture frame.
       */
      var frame = document.createElement(`div`);
      frame.classList.add(`picture-frame`);
      frame.onclick = function() {
        var clicked = this.getElementsByTagName(`img`)[0];
        var index = parseInt(clicked.getAttribute(`index`));
        cvb._displayFullscreenPicture(index, cvb);
        PageUtil.fadeIn(`#div-fs`);
      };

      /*
       * Picture.
       */
      var picture = JSON.parse(collection[i]);
      var img = document.createElement(`img`);
      /*
       * Index is used to retrieve info from collection
       * when clicked (see onclick above).
       */
      img.setAttribute(`index`, i);
      img.src = this._getFilePath(picture);

      /*
       * Adding picture to frame and frame to temporary container.
       */
      frame.appendChild(img);
      view.appendChild(frame);
    }

    return view;
  }

  /*
   * Displays the full size picture once clicked on, with
   * navigation buttons and picture information labels.
   *
   * @access  private
   */
  async _displayFullscreenPicture(index, cvb) {
    var collection = await cvb._getCollection();
    var jsonItem = JSON.parse(collection[index]);

    /*
     * Displaying actual picture.
     */
    document.getElementById(`img-fs`).src = cvb._getFilePath(jsonItem);

    /*
     * Displaying picture information
     */
    var infoDiv = document.getElementById(`div-fs-info`);
    infoDiv.innerHTML = ``;
    var jsonInfoArray = [`readableDate`, `location`,      `description`];
    var htmlInfoArray = [`p-fs-date`,    `p-fs-location`, `p-fs-description`];
    for (let i = 0 ; i < jsonInfoArray.length ; i++) {
      var value = jsonItem[jsonInfoArray[i]];
      if (value != null) {
        var p = document.createElement(`p`);
        p.setAttribute(`id`, htmlInfoArray[i]);
        p.classList.add(`fs-info`);
        p.innerHTML = value;
        infoDiv.appendChild(p);
      }
    }

    /*
     * Binding prev/next button functions.
     */
    PageUtil.bindOnclick(`#btn-fs-prev`, function() {
      var prevIndex = (index + collection.length - 1) % collection.length;
      cvb._displayFullscreenPicture(prevIndex, cvb);
    });

    PageUtil.bindOnclick(`#btn-fs-next`, function() {
      var nextIndex = (index + 1) % collection.length;
      cvb._displayFullscreenPicture(nextIndex, cvb);
    });
  }

  /*
   * Returns the file path of an item of the collection.
   *
   * Using the name of the collection and the file name.
   *
   * @access  private
   * @param   JSONObject  item  the item which path we want
   * @return  string            the path of the item
   */
  _getFilePath(item) {
    return `/images/${this._name}/${item.fileName}`;
  }
}