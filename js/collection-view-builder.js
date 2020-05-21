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
  _getCollection() {
    if (this._collection === null) {
      var request = new XMLHttpRequest();
      request.open(`GET`, `/api/collection/get-collection.php?name=${this._name}`, false);
      request.send();

      var response = JSON.parse(request.response);
      this._collection = response.content;
      this._availableGroupings = response.extra.availableGroupings;
    }

    return this._collection;
  }

  /**
   * Builds a view containing the collection.
   *
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
  drawView(displayMode, elemOrSel, order = CollectionViewBuilder.ASC(), grouping = null) {
    /*
     * Loads the collection for the first time if not al-
     * ready done.
     */
    this._getCollection();

    /*
     * Checks if order and grouping are valid or reverts to
     * default. Orders and groups the collection before
     * displaying it.
     */
    grouping = this._availableGroupings.includes(grouping) ? grouping : null;
    order    = CollectionViewBuilder.DISPLAY_ORDER().includes(order) ? order : CollectionViewBuilder.ASC();
    this._sort(order, grouping);

    var collectionView;
    switch (displayMode) {
      case CollectionViewBuilder.GALLERY():
        collectionView = this._buildGalleryView();
        break;

      case CollectionViewBuilder.DETAILS():
        collectionView = this._buildDetailsListView();
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
    var fullscreenView = this._buildFullscreenView();
    document.body.appendChild(fullscreenView);
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
   _sort(order, grouping) {
    this._getCollection().sort(function (x, y) {
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
  _buildGalleryView() {
    /*
     * Temporary container to hold the view.
     */
    var view = document.createElement(`div`);

    /*
     * Used to "bind" the CollexionViewBuilder without
     * overriding "this" which is needed in this context.
     */
    var cvb = this;
    for (let i = 0 ; i < this._getCollection().length ; i++) {
      /*
       * Picture frame.
       */
      var frame = document.createElement(`div`);
      frame.classList.add(`picture-frame`);
      frame.onclick = function() {
        var clickedImage = this.getElementsByTagName(`img`)[0];
        var index = parseInt(clickedImage.getAttribute(`index`));
        cvb._displayPicture(index, cvb);
        var zoomContainer = document.getElementById(`zoom-container`);
        PageUtil.fadeIn(zoomContainer);
      };

      /*
       * Picture.
       */
      var picture = JSON.parse(this._getCollection()[i]);
      var img = document.createElement(`img`);
      img.setAttribute(`index`, i);
      img.setAttribute(`date`, picture.readableDate);
      img.setAttribute(`location`, picture.location);
      img.setAttribute(`description`, picture.description);
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
   * Builds the view conaining the fullscreen picture when
   * clicked.
   *
   * @access  private
   * @return  HTMLElement  the view containing the full-
   *                       screen picture
   */
  _buildFullscreenView() {
    // Building zoom container, image, labels and buttons.
    var zoomContainer = document.createElement(`div`);
    zoomContainer.setAttribute(`id`, `zoom-container`);

    var prevButton = document.createElement(`i`);
    prevButton.setAttribute(`id`, `prev-button`);
    prevButton.classList.add(`material-icons`);
    prevButton.innerHTML = `navigate_before`;

    var zoomImg = document.createElement(`img`);
    zoomImg.setAttribute(`id`, `zoom-img`);

    var nextButton = document.createElement(`i`);
    nextButton.setAttribute(`id`, `next-button`);
    nextButton.classList.add(`material-icons`);
    nextButton.innerHTML = `navigate_next`;

    var closeButton = document.createElement(`i`);
    closeButton.setAttribute(`id`, `zoom-close`);
    closeButton.classList.add(`material-icons`);
    closeButton.innerHTML = `close`;

    var zoomInfos = document.createElement(`div`);
    zoomInfos.setAttribute(`id`, `zoom-infos`);

    // Binding onclick event to close button.
    closeButton.onclick = function() {
      PageUtil.fadeOut(zoomContainer);
    };

    // Adding all elements to zoom container and zoom
    // container to general container.
    zoomContainer.appendChild(prevButton);
    zoomContainer.appendChild(zoomImg);
    zoomContainer.appendChild(nextButton);
    zoomContainer.appendChild(zoomInfos);
    zoomContainer.appendChild(closeButton);

    return zoomContainer;
  }

  /*
   * Displays the full size picture once clicked on, with
   * navigation buttons and picture information labels.
   *
   * @access  private
   */
  _displayPicture(index, galleryBuilder) {
    var currentGallery = galleryBuilder._getCollection();
    var picture = JSON.parse(currentGallery[index]);
    document.getElementById(`zoom-img`).src = galleryBuilder._getFilePath(picture);

    document.getElementById(`zoom-infos`).innerHTML = `` +
      ((picture.date        == ``) ? `` : `<p id="img-location">${picture.date}</p>`) +
      ((picture.location    == ``) ? `` : `<p id="img-description">${picture.location}</p>`) +
      ((picture.description == ``) ? `` : `<p id="img-description">${picture.description}</p>`);

    document.getElementById(`prev-button`).onclick = function() {
      var prevIndex = (index + currentGallery.length - 1) % currentGallery.length;
      galleryBuilder._displayPicture(prevIndex, galleryBuilder);
    }

    document.getElementById(`next-button`).onclick = function() {
      var nextIndex = (index + 1) % currentGallery.length;
      galleryBuilder._displayPicture(nextIndex, galleryBuilder);
    }
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