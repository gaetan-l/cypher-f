import PageUtil from "/js/page-util.js";
import TextUtil from "/js/text-util.js";

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
  static GROUPED() {return true;}
  static NOT_GROUPED() {return false;}

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
    this._currentOrder;
    this._currentDirection;
    this._currentGrouping;
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
   * @param  boolean     grouping      specifies if the
   *                                   items have to be
   *                                   grouped
   * TODO: @params
   */
  async asyncDrawAll(displayMode, elemOrSel, order = CollectionViewBuilder.DATE(), direction = CollectionViewBuilder.ASC(), grouping = CollectionViewBuilder.NOT_GROUPED(), secDirection = CollectionViewBuilder.ASC()) {
    /*
     * Checks if order is valid or reverts to default.
     */
    order = this._availableGroupings.includes(order) ? order : CollectionViewBuilder.DATE();

    /*
     * When ordering by date, the "secondary" order is, in
     * fact the actually specified "primary" order (there
     * will just be one ordering, the date, but by defining
     * the "secondary" direction, we avoid doing a specific
     * treatment for collections ordered by date later).
     */
    secDirection = (order === CollectionViewBuilder.DATE() ? direction : secDirection);

    /*
     * Initializes the collection before anything is done.
     */
    await this._asyncGetCollection();

    await this.asyncDrawToolbarView(displayMode, elemOrSel);
    await this.asyncRedraw(displayMode, elemOrSel, order, direction, grouping, secDirection);
    await this._asyncDrawFullscreenView();
    PageUtil.fadeIn(`#main-panel`);
  }

  /**
   * Redraws the collection view.
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
   * TODO: @params
   */
  async asyncRedraw(displayMode, elemOrSel, order, direction, grouping, secDirection) {
    PageUtil.fadeOut(`#collection-content`, PageUtil.IGNORE_NOT_FOUND_WARNING());
    var content = document.getElementById(`collection-content`);
    if (content) {
      await PageUtil.asyncWaitForIt(250);
      content.parentNode.removeChild(content);
    }
    await this.asyncDrawCollectionView(displayMode, elemOrSel, order, direction, grouping, secDirection);
    await this._pageBuilder.translator.asyncTranslatePage();
    PageUtil.fadeIn(`#collection-content`);
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
  async asyncDrawToolbarView(displayMode, elemOrSel) {
    var toolbar = document.createElement(`div`);
    toolbar.classList.add(`collection-toolbar`);

    switch (displayMode) {
      case CollectionViewBuilder.GALLERY():
        var input = document.createElement(`input`);
        toolbar.appendChild(input);

        var toolbarButtonContainer = document.createElement(`div`);
        toolbarButtonContainer.setAttribute(`id`, `collection-toolbar-button-container`);
        toolbarButtonContainer.classList.add(`button-container`);
        toolbarButtonContainer.classList.add(`right-side`);

        var response = await fetch(`/json/icons.json`);
        var icons = await response.json();

        async function _changeOrderGroupingDirection(selectedOrder) {
          var selectedDirection;
          var selectedGrouping;
          var selectedSecDirection;

          if (selectedOrder === this._currentOrder) {
            /*
             * Toggling between the different directions
             * and grouping like this:
             * 1st click: ascending,  no grouping
             * 2nd click: descending, no grouping
             * 3rd click: ascending,  with grouping
             * 4th click: descending,  with grouping
             * TODO: do this with an array of classes containing boolean and an order
             */
            switch ([this._currentDirection, this._currentGrouping].toString()) {
              case [CollectionViewBuilder.ASC(), CollectionViewBuilder.NOT_GROUPED()].toString():
                selectedDirection = CollectionViewBuilder.DESC();
                selectedGrouping = CollectionViewBuilder.NOT_GROUPED();
                break;

              case [CollectionViewBuilder.DESC(), CollectionViewBuilder.NOT_GROUPED()].toString():
                selectedDirection = CollectionViewBuilder.ASC();
                selectedGrouping = CollectionViewBuilder.GROUPED();
                break;

              case [CollectionViewBuilder.ASC(), CollectionViewBuilder.GROUPED()].toString():
                selectedDirection = CollectionViewBuilder.DESC();
                selectedGrouping = CollectionViewBuilder.GROUPED();
                break;

              case [CollectionViewBuilder.DESC(), CollectionViewBuilder.GROUPED()].toString():
                selectedDirection = CollectionViewBuilder.ASC();
                selectedGrouping = CollectionViewBuilder.NOT_GROUPED();
                break;
            }
            selectedDirection = this._currentDirection === CollectionViewBuilder.ASC() ? CollectionViewBuilder.DESC() : CollectionViewBuilder.ASC();
          }
          else {
            selectedDirection = CollectionViewBuilder.ASC();
            selectedGrouping = false;
          }

          if (selectedOrder === `date`) {
            selectedSecDirection = selectedDirection;
          }
          else {
            if (selectedOrder !== this._currentOrder) {
              selectedSecDirection = CollectionViewBuilder.ASC();
            }
            else {
              selectedSecDirection = this._currertSecDirection;
            }
          }

          await this.asyncRedraw(displayMode, elemOrSel, selectedOrder, selectedDirection, selectedGrouping, selectedSecDirection);
        }

        async function _changeSecDirection() {
          if (this._currentOrder !== `date`) {
            await this.asyncRedraw(displayMode, elemOrSel, this._currentOrder, this._currentDirection, this._currentGrouping, this._currertSecDirection === CollectionViewBuilder.DESC() ? CollectionViewBuilder.ASC() : CollectionViewBuilder.DESC());
          }
        }

        /*
         * Bind "this" to inner functions.
         */
        const _boundChangeOrderGroupingDirection = _changeOrderGroupingDirection.bind(this);
        const _boundChangeSecDirection = _changeSecDirection.bind(this);

        for (let i = 0 ; i < this._availableGroupings.length ; i++) {
          /*
           * block-scoped variable with let instead of var.
           */
          let order = this._availableGroupings[i];

          var button = document.createElement(`i`);
          button.setAttribute(`id`, `btn-grouping-${order}`);
          button.classList.add(`material-icons`);
          button.classList.add(`button`);

          PageUtil.bindOnClick(button, function() {_boundChangeOrderGroupingDirection(order);});

          /*
           * We have to put it here instead of outside the
           * for loop for it to be asynchronous.
           */
          if (order ===`date`) {
            PageUtil.bindOnRightClick(button, function() {_boundChangeSecDirection();});
          }

          /*
           * Retrieve grouping icon in icons.json, set it
           * to default icon if not found.
           */
          var iconName = TextUtil.getJsonValue(order, icons);
          if (!iconName) {
            iconName = TextUtil.getJsonValue(`default`, icons);
          }
          button.innerHTML = iconName;

          var iconNotifContainer = document.createElement(`div`);
          iconNotifContainer.classList.add(`icon-notif-container`)
          iconNotifContainer.appendChild(button);
          toolbarButtonContainer.appendChild(iconNotifContainer);
        }

        toolbar.appendChild(toolbarButtonContainer);
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
   * TODO: @params
   */
  async asyncDrawCollectionView(displayMode, elemOrSel, order, direction, grouping, secDirection) {
    /* 
     * Orders and groups the collection before displaying
     * it.
     */
    await this._asyncSort(order, direction, grouping, secDirection);

    var collectionView;
    switch (displayMode) {
      case CollectionViewBuilder.GALLERY():
        collectionView = await this._asyncBuildGalleryView(grouping); // TODO grouping?
        break;

      case CollectionViewBuilder.DETAILS():
        collectionView = await this._buildDetailsListView(grouping); // TODO grouping?
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
    fsView.setAttribute(`id`, `polaroid-fullscreen`);
    document.body.appendChild(fsView);
    await PageUtil.replaceElementWithTemplate(`#polaroid-fullscreen`);
    PageUtil.bindOnClick(`#btn-fs-close`,  function() {
      PageUtil.fadeOut(`#polaroid-fullscreen`);
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
   * TODO: @params
   */
  async _asyncSort(order, direction, grouping, secDirection) {
    /*
     * Hiding the sorting notifications if they exists.
     */
    var notifs = document.getElementsByClassName(`notification-sort`);
    for (let i = 0 ; i < notifs.length ; i++) {
      PageUtil.fadeOut(notifs[i]);
    }

    if (notifs.length > 0) {
      /*
       * TO DO: find a better way to wait for the notifica-
       * tion to display without blocking all the process.
       */
      await PageUtil.asyncWaitForIt(250);
    }

    await this._asyncGetCollection();

    /*
     * Translates the groups so that they are ordered pro-
     * perly.
     */
    async function _translateGroups(order, grouping) {
      var length = (await this._asyncGetCollection()).length;
      for (let i = 0 ; i < length ; i++) {
        var item = JSON.parse((await this._asyncGetCollection())[i]);
        let translatedGroup = ``;
        switch (order) {
          case CollectionViewBuilder.DATE():
            translatedGroup = item[order].substring(0, 4);
            break;

          default:
            translatedGroup = await this._pageBuilder.translator.asyncGetTranslatedWord(`groupings.${order}-${item[order]}`);
            break;
        }
        item[`translatedGroup`] = translatedGroup;
        (await this._asyncGetCollection())[i] = JSON.stringify(item);
      }
    }

    const _boundTranslateGroups = _translateGroups.bind(this);
    await _boundTranslateGroups(order, grouping);

    this._collection.sort(function (x, y) {
      var jsonX = JSON.parse(x);
      var jsonY = JSON.parse(y);

      /*
       * No need to use the groups to sort the dates as
       * collection is sorted by date anyway below.
       */
      if (!(order === `date`)) {
        var groupX = jsonX[`translatedGroup`];
        var groupY = jsonY[`translatedGroup`];

        if (groupX !== groupY) {
          return (direction === CollectionViewBuilder.DESC() ? groupY.localeCompare(groupX) : groupX.localeCompare(groupY));
        }
      }

      /*
       * After grouping, items are sorted chronologically,
       * depending on the order.
       */
      var dateX = Date.parse(jsonX.date);
      var dateY = Date.parse(jsonY.date);
      return secDirection === CollectionViewBuilder.DESC() ? dateY - dateX : dateX - dateY;
    });

    /*
     * Creating the primary sorting notification icon if
     * it doesn't exist already.
     */
    var primaryNotif = document.getElementById(`notification-sort-primary`);
    if (!primaryNotif) {
      primaryNotif = document.createElement(`i`);
      primaryNotif.setAttribute(`id`, `notification-sort-primary`);
      primaryNotif.classList.add(`notification`);
      primaryNotif.classList.add(`notification-sort`);
      primaryNotif.classList.add(`sort-${order}`);
      primaryNotif.classList.add(`material-icons`);
      primaryNotif.classList.add(`fadable`);
    }

    primaryNotif.innerHTML = direction === CollectionViewBuilder.DESC() ? `arrow_drop_up` : `arrow_drop_down`;
    document.getElementById(`btn-grouping-${order}`).parentNode.appendChild(primaryNotif);

    /*
     * Finally, when all the sorting treatment has been
     * done and the icon created, we display it.
     */
    PageUtil.fadeIn(primaryNotif);

    /**
     * Same treatment with the secondary notification. Only
     * displayed if it is DESC().
     */
    if((order !== `date`) && (secDirection !== CollectionViewBuilder.ASC())) {
      var secondaryNotif = document.getElementById(`notification-sort-secondary`);
      if (!secondaryNotif) {
        secondaryNotif = document.createElement(`i`);
        secondaryNotif.setAttribute(`id`, `notification-sort-secondary`);
        secondaryNotif.classList.add(`notification-sort`);
        secondaryNotif.classList.add(`material-icons`);
        secondaryNotif.classList.add(`notification`);
        secondaryNotif.classList.add(`fadable`);
        secondaryNotif.innerHTML = `arrow_drop_up`;
        document.getElementById(`btn-grouping-date`).parentNode.appendChild(secondaryNotif);
      }

      /*
       * Finally, when all the sorting treatment has been
       * done and the icon created, we display it.
       */
      PageUtil.fadeIn(secondaryNotif);
    }

    this._currentOrder = order;
    this._currentDirection = direction
    this._currentGrouping = grouping;
    this._currertSecDirection = secDirection;
  }

  /*
   * Builds a gallery view containing the collection.
   *
   * @access  private
   * @param   string  grouping  the grouping used to
   *                            group the pictures
   */
  async _asyncBuildGalleryView(grouping) {
    /*
     * Temporary container to hold the view.
     */
    var wrapper = document.createElement(`div`);
    var view = document.createElement(`div`);
    view.setAttribute(`id`, `collection-content`);
    view.classList.add(`fadable`);
    wrapper.appendChild(view);

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

      if (grouping) {
        /*
         * If current picture is not part of the currently
         * open one, we create a new one.
         */
        var currGroup = picture[`translatedGroup`];
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
        PageUtil.fadeIn(`#polaroid-fullscreen`);
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

    return wrapper;
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
    PageUtil.bindOnClick(`#btn-fs-prev`, function() {
      var prevIndex = (index + collection.length - 1) % collection.length;
      cvb._asyncDisplayFullscreenPicture(prevIndex, cvb);
    });

    PageUtil.bindOnClick(`#btn-fs-next`, function() {
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
