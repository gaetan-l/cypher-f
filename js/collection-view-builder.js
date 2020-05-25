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
   * @param  string       name         name of the collec-
   *                                   tion, used to fetch
   *                                   it via the API
   * @param  PageBuilder  pageBuilder  the pageBuilder used
   *                                   to build the page
   */
  constructor(name, pageBuilder) {
    this._name = name;
    this._pageBuilder = pageBuilder;

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
  async _asyncGetCollection() {
    if (this._collection === null) {
      var response = await fetch(`/api/collection/get-collection.php?name=${this._name}`, {method: `GET`});
      var json = await response.json();
      this._collection = json.content;
      this._availableGroupings = json.extra.availableGroupings;
    }

    return this._collection;
  }

  /**
   * Draws both the collection and the fullscreen views.
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
  async asyncDrawAll(displayMode, elemOrSel, order = CollectionViewBuilder.ASC(), grouping = null) {
    this.drawToolbarView(displayMode, elemOrSel);
    await this.asyncDrawCollectionView(displayMode, elemOrSel, order, grouping);
    await this._asyncDrawFullscreenView();
  }

  /**
   * Draws the collection toolbar view.
   *
   * @param  string       displayMode  the type of view
   *                                   that is to be drawn
   * @param  HTMLElement  elemOrSel    the HTMLElement to
   *          or                       access or the selec-
   *         string                    tor used to access
   *                                   it
   */
  drawToolbarView(displayMode, elemOrSel) {
    var toolbar = document.createElement(`div`);
    toolbar.classList.add(`collection-toolbar`);

    switch (displayMode) {
      case CollectionViewBuilder.GALLERY():
        break;

      case CollectionViewBuilder.DETAILS():
        break;
    }

    var container = PageUtil.getUniqueElement(elemOrSel);
    container.appendChild(toolbar);
  }

  /**
   * Draws the view containing the collection.
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
  async asyncDrawCollectionView(displayMode, elemOrSel, order = CollectionViewBuilder.ASC(), grouping = null) {
    /*
     * Checks if order and grouping are valid or reverts to
     * default. Orders and groups the collection before
     * displaying it.
     */
    await this._asyncSort(order, grouping);
    grouping = this._availableGroupings.includes(grouping) ? grouping : null;

    var collectionView;
    switch (displayMode) {
      case CollectionViewBuilder.GALLERY():
        collectionView = await this._asyncBuildGalleryView(grouping);
        break;

      case CollectionViewBuilder.DETAILS():
        collectionView = await this._buildDetailsListView(grouping);
        break;
    }

    /*
     * Adding collection view to specified container.
     */
    var container = PageUtil.getUniqueElement(elemOrSel);
    while (collectionView.firstChild) {
      container.appendChild(collectionView.firstChild);
    }
  }

  /**
   * Draws the view containing the a fullscreen picture once
   * clicked.
   */
  async _asyncDrawFullscreenView() {
    var fsView = document.createElement(`div`);
    fsView.setAttribute(`id`, `fullscreen-container`);
    document.body.appendChild(fsView);
    await PageUtil.replaceElementWithTemplate(`#fullscreen-container`);
    await this._pageBuilder.translator.asyncTranslatePage();
    PageUtil.bindOnclick(`#btn-fs-close`,  function() {
      PageUtil.fadeOut(`#fullscreen-container`);
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
  async _asyncSort(order, grouping) {
    await this._asyncGetCollection();

    /*
     * Translates the groups so that they are ordered pro-
     * perly.
     */
    async function _translateGroups(grouping) {
      var length = (await this._asyncGetCollection()).length;
      for (let i = 0 ; i < length ; i++) {
        var item = JSON.parse((await this._asyncGetCollection())[i]);
        var translatedGroup = ``;
        switch (grouping) {
          case CollectionViewBuilder.DATE():
            break;

          case null:
            break;

          default:
            translatedGroup = await this._pageBuilder.translator.asyncGetTranslatedWord(`groupings.${grouping}-${item[grouping]}`);
            break;
        }
        item[`translatedGroup`] = translatedGroup;
        (await this._asyncGetCollection())[i] = JSON.stringify(item);
      }
    }

    const _boundTranslateGroups = _translateGroups.bind(this);
    await _boundTranslateGroups(grouping);

    this._collection.sort(function (x, y) {
      var jsonX = JSON.parse(x);
      var jsonY = JSON.parse(y);

      /*
       * Groupings are always sorted alphabetically no mat-
       * ter the order, except for date...
       */
      if (!((grouping === null) || (grouping === CollectionViewBuilder.DATE()))) {
        var groupX = jsonX[`translatedGroup`];
        var groupY = jsonY[`translatedGroup`];

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
   * @param   string  grouping  the grouping used to
   *                            group the pictures
   */
  async _asyncBuildGalleryView(grouping = null) {
    /*
     * Temporary container to hold the view.
     */
    var view = document.createElement(`div`);

    /*
     * Used to "bind" the CollexionViewBuilder without
     * overriding "this" which is needed in this context.
     */
    var cvb = this;
    var collection = await this._asyncGetCollection();

    var group = document.createElement(`div`);
    group.setAttribute(`id`, `polaroid-group-`)
    group.classList.add(`polaroid-group`);
    var openGroup = ``;

    var groupContent = document.createElement(`div`);
    groupContent.classList.add(`polaroid-group-content`);
    group.appendChild(groupContent);

    for (let i = 0 ; i < collection.length ; i++) {
      var picture = JSON.parse(collection[i]);

      if (grouping !== null) {
        /*
         * If current picture is not part of the currently
         * open one, we create a new one.
         */
        var currGroup = picture[grouping];
        if (currGroup !== openGroup) {
          /*
           * Prevents from appending empty group created by
           * default, which would be filled only if no
           * grouping is selected.
           */
          if (groupContent.firstChild) {
            view.appendChild(group);
          }

          group = document.createElement(`div`);
          group.setAttribute(`id`, `polaroid-group-${currGroup}`);
          group.classList.add(`polaroid-group`);

          var title = document.createElement(`h1`);
          title.setAttribute(`data-i18n`, `groupings.${grouping}-${currGroup}`);
          title.innerHTML = currGroup;
          group.appendChild(title);

          groupContent = document.createElement(`div`);
          groupContent.classList.add(`polaroid-group-content`);
          group.appendChild(groupContent);

          openGroup = currGroup;
        }
      }

      /*
       * Picture frame.
       */
      var frame = document.createElement(`div`);
      frame.classList.add(`polaroid-frame`);
      frame.onclick = function() {
        var clicked = this.getElementsByTagName(`img`)[0];
        var index = parseInt(clicked.getAttribute(`index`));
        cvb._asyncDisplayFullscreenPicture(index, cvb);
        PageUtil.fadeIn(`#fullscreen-container`);
      };

      /*
       * Picture inset box-shadow wrapper.
       * @link https://stackoverflow.com/questions/61961334/css-img-inset-box-shadow-trick-center-vh-anchor-max-height
       */
      var a = document.createElement(`a`);
      a.setAttribute(`href`, `#`);
      a.classList.add(`polaroid-shadow`);
      a.classList.add(`dummy-link`);

      /*
       * Picture.
       */
      var img = document.createElement(`img`);
      /*
       * Index is used to retrieve info from collection
       * when clicked (see onclick above).
       */
      img.classList.add(`polaroid-image`);
      img.setAttribute(`index`, i);
      img.src = this._getFilePath(picture);

      /*
       * Adding picture to frame and frame to temporary container.
       */
      a.appendChild(img);
      frame.appendChild(a);
      groupContent.appendChild(frame);
    }

    view.appendChild(group);

    return view;
  }

  /*
   * Displays the full size picture once clicked on, with
   * navigation buttons and picture information labels.
   *
   * @access  private
   */
  async _asyncDisplayFullscreenPicture(index, cvb) {
    var collection = await cvb._asyncGetCollection();
    var jsonItem = JSON.parse(collection[index]);

    /*
     * Displaying actual picture.
     */
    document.getElementById(`fullscreen-image`).src = cvb._getFilePath(jsonItem);

    /*
     * Displaying picture information
     */
    var infoDiv = document.getElementById(`fullscreen-infobox`);
    infoDiv.innerHTML = ``;
    var jsonInfoArray = [`readableDate`,    `location`,            `description`];
    var htmlInfoArray = [`fullscreen-date`, `fullscreen-location`, `fullscreen-description`];
    for (let i = 0 ; i < jsonInfoArray.length ; i++) {
      var value = jsonItem[jsonInfoArray[i]];
      if (value != null) {
        var p = document.createElement(`p`);
        p.setAttribute(`id`, htmlInfoArray[i]);
        p.classList.add(`fullscreen-info`);
        p.innerHTML = value;
        infoDiv.appendChild(p);
      }
    }

    /*
     * Binding prev/next button functions.
     */
    PageUtil.bindOnclick(`#btn-fs-prev`, function() {
      var prevIndex = (index + collection.length - 1) % collection.length;
      cvb._asyncDisplayFullscreenPicture(prevIndex, cvb);
    });

    PageUtil.bindOnclick(`#btn-fs-next`, function() {
      var nextIndex = (index + 1) % collection.length;
      cvb._asyncDisplayFullscreenPicture(nextIndex, cvb);
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