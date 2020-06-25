import * as CollUtil from "/js/coll-util.js";
import      PageUtil from "/js/page-util.js";
import      TextUtil from "/js/text-util.js";
import    Translator from "/js/translator.js";

`use strict`

/**
 * Helper class to build views able to display collections
 * (list, gallery, etc.).
 */
export default class CollViewBuilder {
  /**
   * CollViewBuilder constructor.
   *
   * @param  string       name         name of the collec-
   *                                   tion, used to fetch
   *                                   it via the API
   * @param  PageBuilder  pageBuilder  the pageBuilder used
   *                                   to build the page
   */
  constructor(name, pageBuilder) {
    this._name                = name;
    this._pageBuilder         = pageBuilder;

    this._apiPath             = `/api/collection/get-collection.php?name=${this.name}`;
    this._iconsJsonPath       = `/json/icons.json`;
    this._imgPath             = `/images/${name}/`

    this._redrawLocked        = false;

    this._collection          = null;
    this._sortableAttributes  = [];
    this._lookupAttributes    = [];

    /*
     * Indicate attributes that are excluded from html
     * tags or from display.
     */
    this._excludedFromHtml    = [CollUtil.DATE, CollUtil.EXTENSION, `trlanslatedCurrentSortingAttribute`];
    this._excludedFromDisplay = []; // + excludedFromHtml

    /*
     * Indicate attributes that have multiple values,
     * separated by semicolons and need to be rewritten
     * properly with commas and spaces, and aventually
     * with hashes.
     */
    this._needsHashtag        = [CollUtil.TAGS];
    this._needsJoining        = [CollUtil.DESCRIPTION];

    /*
     * Indicates attributes that have to be flattened for
     * lookup purpose.
     */
    this._needsFlattening     = [CollUtil.COUNTRY, CollUtil.DESCRIPTION, CollUtil.LOCATION, CollUtil.NAME];

    /*
     * Indicates attributes that are codes that can be
     * translated.
     */
    this._needsTranslation    = [CollUtil.COUNTRY, CollUtil.TAGS, CollUtil.TYPE];

    this._currDateDirection   = CollUtil.Direction.ASC;
  }

  get name()                  {return this._name;}
  get pageBuilder()           {return this._pageBuilder;}

  get apiPath()               {return this._apiPath;}
  get iconsJsonPath()         {return this._iconsJsonPath;}
  get imgPath()               {return this._imgPath;}

  get redrawLocked()          {return this._redrawLocked;}

  get collection()            {return this._collection;}
  get sortableAttributes()    {return this._sortableAttributes;}
  get lookupAttributes()      {return this._lookupAttributes;}
  get excludedFromHtml()      {return this._excludedFromHtml;}
  get excludedFromDisplay()   {return this._excludedFromDisplay;}
  get needsHashtag()          {return this._needsHashtag;}
  get needsJoining()          {return this._needsJoining;}
  get needsFlattening()       {return this._needsFlattening;}
  get needsTranslation()      {return this._needsTranslation;}

  get currDisplayMode()       {return this._currDisplayMode;}
  get currSortingAttribute()  {return this._currSortingAttribute;}
  get currSortingDirection()  {return this._currSortingDirection;}
  get currGrouping()          {return this._currGrouping;}
  get currDateDirection()     {return this._currDateDirection;}

  _redrawLock()   {this._redrawLocked = true;}
  _redrawUnlock() {this._redrawLocked = false;}

  set collection          (collection)           {this._collection           = collection;}
  set sortableAttributes  (sortableAttributes)   {this._sortableAttributes   = sortableAttributes;}

  set currDisplayMode     (displayMode)          {this._currDisplayMode      = displayMode;}
  set currSortingAttribute(currSortingAttribute) {this._currSortingAttribute = currSortingAttribute;}
  set currSortingDirection(currSortingDirection) {this._currSortingDirection = currSortingDirection;}
  set currGrouping        (currGrouping)         {this._currGrouping         = currGrouping;}
  set currDateDirection   (currDateDirection)    {this._currDateDirection    = currDateDirection;}

  /*
   * Returns the collection associated with this
   * CollViewBuilder.
   *
   * Fetches it via the api if not already loaded. 
   *
   * @access  private
   * @return  JSONObject  the collection in json format
   */
  async _asyncGetCollection() {
    if (this.collection === null) {
      const response = await fetch(this.apiPath, {method: `GET`});
      const json = await response.json();
      this.collection = json.content;
      this.sortableAttributes = json.extra.sortableAttributes;
    }

    return this.collection;
  }

  /**
   * Draws avery componenr necessary to display a collec-
   * tion.
   *
   * @param  HTMLElement  container         the HTMLElement
   *          or                            in which to
   *         string                         draw the view,
   *                                        or selector to
   *                                        access it
   * @param  DisplayMode  displayMode       the type of view
   *                                        to draw
   * @param  string       sortingAttribute  the attribute
   *                                        used to sort
   *                                        the collection
   * @param  Direction    sortingDirection  ascending or
   *                                        descending
   * @param  Grouping     grouping          if the items
   *                                        have to be
   *                                        grouped or not
   * @param  Direction    dateDirection     the chronologi-
   *                                        cal sorting
   */
  async asyncDrawAll(container, displayMode = CollUtil.DisplayMode.POLAROID_GALLERY, sortingAttribute, sortingDirection, grouping, dateDirection) {
    const dm = displayMode;
    /*
     * Initializes the collection before anything is done.
     */
    await this._asyncGetCollection();

    this.currDisplayMode      = displayMode;

    await this._asyncDrawToolbarView(container);
    await this._asyncRedraw(container, displayMode, sortingAttribute, sortingDirection, grouping, dateDirection);
    await this._asyncDrawFullscreenView();
    PageUtil.fadeIn(`#main-panel`);
  }

  /**
   * Redraws the collection content and associated views.
   *
   * @access  private
   * @param   HTMLElement  container         the
   *           or                            HTMLElement in
   *          string                         which to draw
   *                                         the view, or
   *                                         selector to
   *                                         access it
   * @param   DisplayMode  displayMode       the type of
   *                                         view to draw
   * @param   string       sortingAttribute  the attribute
   *                                         used to sort
   *                                         the collection
   * @param   Direction    sortingDirection  ascending or
   *                                         descending
   * @param   Grouping     grouping          if the items
   *                                         have to be
   *                                         grouped or not
   * @param   Direction    dateDirection     the chronologi-
   *                                         cal sorting
   */
  async _asyncRedraw(container,
                     displayMode =      CollUtil.DisplayMode.POLAROID_GALLERY,
                     sortingAttribute = CollUtil.DATE,
                     sortingDirection = CollUtil.Direction.ASC,
                     grouping =         CollUtil.Grouping.NOT_GROUPED,
                     dateDirection =    CollUtil.Direction.ASC) {

    if (!this.redrawLocked) {
      this._redrawLock();

      this.currDisplayMode      = displayMode;
      this.currSortingAttribute = sortingAttribute;
      this.currSortingDirection = sortingDirection;
      this.currGrouping         = grouping;
      this.currDateDirection    = dateDirection;

      container = PageUtil.getUniqueElement(container);
      sortingAttribute = this.sortableAttributes.includes(sortingAttribute) ? sortingAttribute : CollUtil.DATE;
      dateDirection = (sortingAttribute === CollUtil.DATE ? sortingDirection : dateDirection);

      const content = document.getElementById(`collection-content`);
      if (content) {
        PageUtil.fadeOut(`#collection-content`, true);
        await PageUtil.asyncWaitForIt(250);
        content.parentNode.removeChild(content);
      }

      await this._asyncGetCollection();
      await this._asyncSort(sortingAttribute, sortingDirection, grouping, dateDirection);

      switch (displayMode) {
        case CollUtil.DisplayMode.POLAROID_GALLERY:
        case CollUtil.DisplayMode.STACKED_GALLERY:
          await this._asyncDrawGalleryView(container, grouping);
          break;

        case CollUtil.DisplayMode.DETAILS:
          await this._asyncDrawDetailsView(container, grouping);
          break;
      }

      await this._pageBuilder.translator.asyncTranslatePage();
      this._filterCollection(document.getElementById(`inp-filter`).value);
      PageUtil.fadeIn(`#collection-content`);

      this._redrawUnlock();
    }
  }

  /**
   * Draws the collection toolbar view.
   *
   * @access  private
   * @param   HTMLElement  container    the HTMLElement in
   *           or                       which to draw the
   *          string                    view, or selector
   *                                    to access it
   */
  async _asyncDrawToolbarView(container) {
    const toolbar = document.createElement(`div`);
    toolbar.classList.add(`collection-toolbar`);

    const filterContainer = document.createElement(`div`);
    filterContainer.classList.add(`toolbar-container`);

    const filterLabel = document.createElement(`p`);
    filterLabel.classList.add(`label`);
    filterLabel.setAttribute(`data-i18n`, `labels.filter`);
    filterContainer.appendChild(filterLabel);

    const boundFilter = this._filterCollection.bind(this);
    const input = document.createElement(`input`);
    input.setAttribute(`id`, `inp-filter`);
    input.addEventListener(`input`, function (e) {boundFilter(this.value);});
    filterContainer.appendChild(input);

    toolbar.appendChild(filterContainer);

    const toolbarButtonContainer = document.createElement(`div`);
    toolbarButtonContainer.setAttribute(`id`, `collection-toolbar-toolbar-container`);
    toolbarButtonContainer.classList.add(`toolbar-container`, `right-side`);

    const response = await fetch(this.iconsJsonPath);
    const icons = await response.json();

    async function changeDisplayMode() {
      await this._asyncRedraw(container, this.currDisplayMode.next, this.currSortingAttribute, this.currSortingDirection, this.currGrouping, this.currDateDirection);
      document.getElementById(`btn-display-mode`).innerHTML = TextUtil.getJsonValue(`display-${this.currDisplayMode.next.value}`, icons);
    }

    const boundChangeDisplayMode = changeDisplayMode.bind(this);
    const changeDisplayButton = document.createElement(`i`);
    changeDisplayButton.setAttribute(`id`, `btn-display-mode`);
    changeDisplayButton.classList.add(`material-icons`, `button`);
    PageUtil.bindOnClick(changeDisplayButton, function() {boundChangeDisplayMode();});
    changeDisplayButton.innerHTML = TextUtil.getJsonValue(`display-${this.currDisplayMode.next.value}`, icons);

    const displayModeLabel = document.createElement(`p`);
    displayModeLabel.classList.add(`label`);
    displayModeLabel.setAttribute(`data-i18n`, `labels.display-mode`);
    toolbarButtonContainer.appendChild(displayModeLabel);
    toolbarButtonContainer.appendChild(changeDisplayButton);

    async function changeSorting(selectedSortingAttribute) {
      let selectedDirection;
      let selectedGrouping;
      let selectedDateDirection;

      if (selectedSortingAttribute === this.currSortingAttribute) {
        let currSorting = CollUtil.Sorting.from(this.currSortingDirection, this.currGrouping);
        let nextSorting = currSorting.next;
        selectedDirection = nextSorting.direction;
        selectedGrouping  = nextSorting.grouping;
      }
      else {
        selectedDirection = CollUtil.Direction.ASC;
        selectedGrouping  = CollUtil.Grouping.NOT_GROUPED;
      }

      if (selectedSortingAttribute === CollUtil.DATE) {
        selectedDateDirection = selectedDirection;
      }
      else if (selectedSortingAttribute !== this.currSortingAttribute) {
        selectedDateDirection = CollUtil.Direction.ASC;
      }
      else {
        selectedDateDirection = this.currDateDirection;
      }

      await this._asyncRedraw(container, this.currDisplayMode, selectedSortingAttribute, selectedDirection, selectedGrouping, selectedDateDirection);
    }

    async function changeDateDirection() {
      if (this.currSortingAttribute !== CollUtil.DATE) {
        await this._asyncRedraw(container, this.currDisplayMode, this.currSortingAttribute, this.currSortingDirection, this.currGrouping, this.currDateDirection.next);
      }
    }

    const boundChangeSorting = changeSorting.bind(this);
    const boundChangeDateDirection = changeDateDirection.bind(this);

    const sortLabel = document.createElement(`p`);
    sortLabel.classList.add(`label`);
    sortLabel.setAttribute(`data-i18n`, `labels.sort`);
    toolbarButtonContainer.appendChild(sortLabel);

    for (let i = 0 ; i < this.sortableAttributes.length ; i++) {
      let sorting = this.sortableAttributes[i];

      const button = document.createElement(`i`);
      button.setAttribute(`id`, `btn-sorting-${sorting}`);
      button.classList.add(`material-icons`, `button`);

      PageUtil.bindOnClick(button, function() {boundChangeSorting(sorting);});
      PageUtil.bindOnRightClick(button, sorting === CollUtil.DATE ? function() {boundChangeDateDirection();} : function() {});

      let iconName = TextUtil.getJsonValue(sorting, icons);
      if (!iconName) {iconName = TextUtil.getJsonValue(`default-sorting`, icons);}
      button.innerHTML = iconName;

      const iconNotifContainer = document.createElement(`div`);
      iconNotifContainer.classList.add(`icon-notif-container`)
      iconNotifContainer.appendChild(button);
      toolbarButtonContainer.appendChild(iconNotifContainer);
    }

    toolbar.appendChild(toolbarButtonContainer);
    container.appendChild(toolbar);
  }

  /**
   * Draws the view containing the a fullscreen picture
   * once clicked.
   *
   * @access  private
   */
  async _asyncDrawFullscreenView() {
    const fsView = document.createElement(`div`);
    fsView.setAttribute(`id`, `picture-fullscreen`);
    document.body.appendChild(fsView);
    await PageUtil.replaceElementWithTemplate(`#picture-fullscreen`);
    PageUtil.bindOnClick(`#btn-fs-close`,  function() {PageUtil.fadeOut(`#picture-fullscreen`);});
  }

  /*
   * Translates the attributes so that they can be looked
   * up and sorted properly.
   * @access  private
   * @param   string  sortingAttribute  the attribute cur-
   *                                       rently used to
   *                                       sort the collec-
   *                                       tion
   */
  async _asyncTranslateSortAttribute(sortingAttribute) {
    const length = (await this._asyncGetCollection()).length;
    const needsTranslation = this.needsTranslation.includes(sortingAttribute);
    for (let i = 0 ; i < length ; i++) {
      const item = JSON.parse((await this._asyncGetCollection())[i]);
      let value = item[sortingAttribute];
      if (sortingAttribute === CollUtil.DATE) {
        value = value.substring(0, 4);
      }
      else if (needsTranslation) {
        const i18nCode = `${sortingAttribute}.${value}`;
        value = await this.pageBuilder.translator.asyncGetTranslatedWord(i18nCode);
      }
      item.trlanslatedCurrentSortingAttribute = value;
      (await this._asyncGetCollection())[i] = JSON.stringify(item);
    }
  }

  /**
   * Sorts and groups the collection.
   *
   * @access  private
   * @param   string     sortingAttribute  the attribute
   *                                       used to sort the
   *                                       collection
   * @param   Direction  sortingDirection  ascending or
   *                                       descending
   * @param   Grouping   grouping          if the items
   *                                       have to be grou-
   *                                       ped or not
   * @param   Direction  dateDirection     the chronologi-
   *                                       cal sorting
   */
  async _asyncSort(sortingAttribute, sortingDirection, grouping, dateDirection) {
    const notifs = document.getElementsByClassName(`notification-sort`);
    Array.from(notifs).forEach((element) => {
      PageUtil.fadeOut(element);
    });

    if (notifs.length > 0) {
      /*
       * TODO: find a better way to wait for the notifica-
       * tion to display without blocking all the process.
       */
      await PageUtil.asyncWaitForIt(250);
    }

    const boundTranslateSortAttribute = this._asyncTranslateSortAttribute.bind(this);
    await boundTranslateSortAttribute(sortingAttribute);

    this.collection.sort(function (x, y) {
      const jsonX = JSON.parse(x);
      const jsonY = JSON.parse(y);

      /*
       * No need to use the groups to sort the dates as
       * collection is sorted by date anyway below.
       */
      if (!(sortingAttribute === CollUtil.DATE)) {
        const groupX = jsonX.trlanslatedCurrentSortingAttribute;
        const groupY = jsonY.trlanslatedCurrentSortingAttribute;

        if (groupX !== groupY) {
          return (sortingDirection === CollUtil.Direction.DESC ? groupY.localeCompare(groupX) : groupX.localeCompare(groupY));
        }
      }

      /*
       * After grouping, items are sorted chronologically,
       * depending on the order.
       */
      const dateX = Date.parse(jsonX.date);
      const dateY = Date.parse(jsonY.date);
      return dateDirection === CollUtil.Direction.DESC ? dateY - dateX : dateX - dateY;
    });

    /*
     * Creating the primary sorting notification icon if
     * it doesn't exist already.
     */
    let primaryNotif = document.getElementById(`notification-sort-primary`);
    if (!primaryNotif) {
      primaryNotif = document.createElement(`i`);
      primaryNotif.setAttribute(`id`, `notification-sort-primary`);
      primaryNotif.classList.add(`material-icons`, `fadable`, `notification`, `notification-sort`, `sort-${sortingAttribute}`);
    }

    primaryNotif.innerHTML = sortingDirection === CollUtil.Direction.DESC ? `arrow_drop_up` : `arrow_drop_down`;
    document.getElementById(`btn-sorting-${sortingAttribute}`).parentNode.appendChild(primaryNotif);

    /*
     * Finally, when all the sorting treatment has been
     * done and the icon created, we display it.
     */
    PageUtil.fadeIn(primaryNotif);

    /**
     * Same treatment with the secondary notification. Only
     * displayed if it is DESC().
     */
    if((sortingAttribute !== CollUtil.DATE) && (dateDirection === CollUtil.Direction.DESC)) {
      let secondaryNotif = document.getElementById(`notification-sort-secondary`);
      if (!secondaryNotif) {
        secondaryNotif = document.createElement(`i`);
        secondaryNotif.setAttribute(`id`, `notification-sort-secondary`);
        secondaryNotif.classList.add(`material-icons`, `fadable`, `notification`, `notification-sort`);
        secondaryNotif.innerHTML = `arrow_drop_up`;
        document.getElementById(`btn-sorting-date`).parentNode.appendChild(secondaryNotif);
      }

      /*
       * Finally, when all the sorting treatment has been
       * done and the icon created, we display it.
       */
      PageUtil.fadeIn(secondaryNotif);
    }

    this.currSortingAttribute = sortingAttribute;
    this.currSortingDirection = sortingDirection
    this.currGrouping         = grouping;
    this.currDateDirection    = dateDirection;
  }

  /*
   * Draws the gallery view containing the collection.
   *
   * @access  private
   * @param   HTMLElement  container  the HTMLElement in
   *           or                     which to draw the
   *          string                  view, or selector
   *                                  to access it
   * @param   Grouping     grouping   if the items have to
   *                                  be grouped or not
   */
  async _asyncDrawGalleryView(container, grouping) {
    /*
     * Can either be stacked or polaroid
     */
    const stacked  = this.currDisplayMode === CollUtil.DisplayMode.STACKED_GALLERY;

    let view = document.getElementById(`collection-content`);
    view = view ? view : document.createElement(`div`);
    view.setAttribute(`id`, `collection-content`);
    view.classList.add(`fadable`);
    container.appendChild(view);

    const collection = await this._asyncGetCollection();

    let group = document.createElement(`div`);
    group.setAttribute(`id`, `collection-group-`)
    group.classList.add(`collection-group`, stacked ? `stacked-group` : `polaroid-group`, `relevant`);
    let openGroup = ``;

    let groupContent = document.createElement(`div`);
    groupContent.classList.add(stacked ? `stacked-group-content` : `polaroid-group-content`);
    if (stacked) {
      const groupWrapper = document.createElement(`div`);
      groupWrapper.classList.add(`stacked-group-wrapper`);
      groupWrapper.appendChild(groupContent);
      group.appendChild(groupWrapper);
    }
    else {
      group.appendChild(groupContent);
    }

    const cvb = this;
    const _boundAsyncDisplayFullscreenPicture = this._asyncDisplayFullscreenPicture.bind(this);

    for (let i = 0 ; i < collection.length ; i++) {
      const item = JSON.parse(collection[i]);

      if (grouping === CollUtil.Grouping.GROUPED) {
        const currGroup = item.trlanslatedCurrentSortingAttribute;
        if (currGroup !== openGroup) {
          /*
           * Prevents from appending empty group created by
           * default, which would be filled only if no
           * grouping is selected because openGroup === ``
           * when created.
           */
          if (groupContent.firstChild) {
            view.appendChild(group);
          }

          group = document.createElement(`div`);
          group.setAttribute(`id`, `collection-group-${currGroup}`);
          group.classList.add(`collection-group`, stacked ? `stacked-group` : `polaroid-group`, `relevant`);

          const title = document.createElement(`h1`);
          title.innerHTML = currGroup;
          if (this.needsTranslation.includes(this.currGrouping)) {
            title.setAttribute(`data-i18n`, `${this.currGrouping}.${item[this.currGrouping]}`);
          }
          group.appendChild(title);

          groupContent = document.createElement(`div`);
          groupContent.classList.add(stacked ? `stacked-group-content` : `polaroid-group-content`);
          if (stacked) {
            const groupWrapper = document.createElement(`div`);
            groupWrapper.classList.add(`stacked-group-wrapper`);
            groupWrapper.appendChild(groupContent);
            group.appendChild(groupWrapper);
          }
          else {
            group.appendChild(groupContent);
          }

          openGroup = currGroup;
        }
      }

      /*
       * Picture frame.
       */
      const frame = document.createElement(`div`);
      frame.classList.add(`collection-item`, stacked ? `stacked-frame` : `polaroid-frame`, `relevant`);
      frame.setAttribute(`coll-index`, i);
      await this._addItemLookup(frame, item);

      frame.onclick = function() {
        _boundAsyncDisplayFullscreenPicture(this);
        PageUtil.fadeIn(`#picture-fullscreen`);
      };


      /*
       * Picture.
       */
      const img = document.createElement(`img`);
      /*
       * Index is used to retrieve info from collection
       * when clicked (see onclick above).
       */
      img.classList.add(stacked ? `stacked-image` : `polaroid-image`);
      img.src = `${this.imgPath}${item.fileName}`;

      /*
       * Adding picture to frame and frame to temporary container.
       */
      /*
       * Picture inset box-shadow wrapper.
       * @link https://stackoverflow.com/questions/61961334/css-img-inset-box-shadow-trick-center-vh-anchor-max-height
       */
      if (stacked) {
        frame.appendChild(img);
      }
      else {
        const a = document.createElement(`a`);
        a.setAttribute(`href`, `#`);
        a.classList.add(`dummy-link`, `image-shadow`);
        a.appendChild(img);
        frame.appendChild(a);
      }
      groupContent.appendChild(frame);
    }

    view.appendChild(group);
  }

  /*
   * Draws the details view containing the collection.
   *
   * @access  private
   * @param   HTMLElement  container  the HTMLElement in
   *           or                     which to draw the
   *          string                  view, or selector
   *                                  to access it
   * @param   Grouping     grouping   if the items have to
   *                                  be grouped or not
   */
  async _asyncDrawDetailsView(container, grouping) {
    let wrapper = document.getElementById(`collection-content`);
    wrapper = wrapper ? wrapper : document.createElement(`div`);
    wrapper.setAttribute(`id`, `collection-content`);
    wrapper.classList.add(`fadable`);
    const view = document.createElement(`table`);
    view.classList.add(`details-view-table`);
    wrapper.appendChild(view);
    container.appendChild(wrapper);

    const collection = await this._asyncGetCollection();

    /*
     * Selecting which headers to display
     */
    const thead = document.createElement(`thead`);
    const theadTr = document.createElement(`tr`);
    const exampleHeaders = Object.keys(JSON.parse(collection[0]));
    const headers = new Array();
    for (let i = 0 ; i < exampleHeaders.length ; i++) {
      const header = exampleHeaders[i];
      if (!(this.excludedFromHtml.includes(header) || this.excludedFromDisplay.includes(header))) {
        headers.push(header);
      }
    }
    /*
     * Sorting headers with Column class in CollUtil
     */
    const collName = this.name;
    headers.sort(function (x, y) {
      let result = 0;
      let ix, iy;
      try {
        try {ix = CollUtil.Column.from(collName, x).index;} catch(error) {ix = 9999; throw error;}
        try {iy = CollUtil.Column.from(collName, y).index;} catch(error) {iy = 9999; throw error;}
      }
      catch(error) {
        console.warn(error);
      }
      finally {
        if (ix < iy) {
          result = -1;
        }
        else if (ix > iy) {
          result = 1;
        }
        return result;
      }
    });
    /*
     * Creating html elements.
     */
    for (let i = 0 ; i < headers.length ; i++) {
      const header = headers[i];
      const th = document.createElement(`th`);
      th.setAttribute(`data-i18n`, TextUtil.toDashCase(`attributes.${header}`));
      theadTr.appendChild(th);
    }
    thead.appendChild(theadTr);
    view.appendChild(thead);

    let groupTbody = document.createElement(`tbody`);
    let openGroup = ``;

    const cvb = this;
    const _boundAsyncDisplayFullscreenPicture = this._asyncDisplayFullscreenPicture.bind(this);

    for (let i = 0 ; i < collection.length ; i++) {
      const item = JSON.parse(collection[i]);

      if (grouping === CollUtil.Grouping.GROUPED) {
        const currGroup = item.trlanslatedCurrentSortingAttribute;
        if (currGroup !== openGroup) {
          /*
           * Prevents from appending empty group created by
           * default, which would be filled only if no
           * grouping is selected because openGroup === ``
           * when created.
           */
          if (groupTbody.firstChild) {
            view.appendChild(groupTbody);
          }

          groupTbody = document.createElement(`tbody`);
          groupTbody.setAttribute(`id`, `details-group-${currGroup}`);
          groupTbody.classList.add(`collection-group`, `details-group`, `relevant`);

          const groupTr = document.createElement(`tr`);
          groupTr.classList.add(`group-header-row`);
          const groupTh = document.createElement(`th`);
          groupTh.setAttribute(`colspan`, headers.length);
          groupTh.innerHTML = currGroup;
          if (this.needsTranslation.includes(this.currGrouping)) {
            groupTh.setAttribute(`data-i18n`, `${this.currGrouping}.${item[this.currGrouping]}`);
          }
          groupTr.appendChild(groupTh);
          groupTbody.appendChild(groupTr);

          openGroup = currGroup;
        }
      }

      const itemTr = document.createElement(`tr`);
      itemTr.classList.add(`collection-item`, `details-row`, `relevant`);
      itemTr.setAttribute(`coll-index`, i);
      await this._addItemLookup(itemTr, item);

      itemTr.onclick = function() {
        _boundAsyncDisplayFullscreenPicture(this);
        PageUtil.fadeIn(`#picture-fullscreen`);
      };

      for (let i = 0 ; i < headers.length ; i++) {
        const td = document.createElement(`td`);
        const attributeName = headers[i];
        const value = item[attributeName];
        td.innerHTML = await this._asyncBeautify(attributeName, value, false, CollUtil.TransMode.CURRENT, true);
        if (this._needsTranslation.includes(attributeName) && !this._needsHashtag.includes(attributeName) && !this._needsJoining.includes(attributeName)) {
          td.setAttribute(`data-i18n`, `${attributeName}.${value}`);
        }

        itemTr.appendChild(td);
      }

      groupTbody.appendChild(itemTr);
    }

    view.appendChild(groupTbody);
  }

  /**
   * Adds item information into the HTMLElement in the form
   * of custom attributes and updates the lookup array.
   *
   * @access  private
   * @param   HTMLElement  element  the html element repre-
   *                                senting the item
   * @param   JSON object  item     the item
   */
  async _addItemLookup(element, item) {
    const attributes = Object.keys(item);
    for (let i = 0 ; i < attributes.length ; i ++) {
      const attr = attributes[i];
      if (!this.excludedFromHtml.includes(attr)) {
        const attrDashName = TextUtil.toDashCase(`item-${attr}`);
        let value = item[attr];

        if (!this.lookupAttributes.includes(attrDashName)) {this.lookupAttributes.push(attrDashName);}

        if (value !== ``) {
          /*
           * If value is gonna be joined later, no need to add it
           * splitted.
           */
          if (!(this.needsHashtag.includes(attr) || this.needsJoining.includes(attr))) {
            element.setAttribute(attrDashName, value);
          }

          let flags = ``;
          if (this.needsHashtag.includes(attr) || this.needsJoining.includes(attr)) {flags += `j`;}
          if (this.needsTranslation.includes(attr)) {flags += `t`;}
          if (flags !== ``) {
            const valueJT = await this._asyncBeautify(attr, value, false, CollUtil.TransMode.ALL);
            const attrWithFlags = `${attrDashName}-${flags}`;
            element.setAttribute(attrWithFlags, valueJT);
            if (!this.lookupAttributes.includes(attrWithFlags)) {this.lookupAttributes.push(attrWithFlags);}
          }

          if (this.needsFlattening.includes(attr)) {
            flags += `i`;
            const valueI = await this._asyncBeautify(attr, value, true, CollUtil.TransMode.ALL);
            const attrWithFlags = `${attrDashName}-${flags}`;
            element.setAttribute(attrWithFlags, valueI);
            if (!this.lookupAttributes.includes(attrWithFlags)) {this.lookupAttributes.push(attrWithFlags);}
          }
        }
      }
    }
  }

  /**
   * Filters the collection by the value passed in para-
   * meter.
   *
   * @access  private
   * @param  string  filter  with which to filter the collec-
   *                         tion
   */
  _filterCollection(filter) {
    filter = TextUtil.flattenString(filter);
    const allElements = document.querySelectorAll(`.collection-item`);
    const selector = this.lookupAttributes.map(attribute => `.collection-item[${attribute}*="${filter}"]`).join(`, `);
    const relevantElements = Array.from(document.querySelectorAll(selector));

    let actualIndex = 0;
    for (let i = 0 ; i < allElements.length ; i++) {
      const element = allElements[i];

      element.classList.remove(`relevant`);
      element.classList.remove(`irrelevant`);
      element.classList.remove(`odd`);
      element.classList.remove(`even`);

      if ((filter === ``) || relevantElements.includes(element)) {
        element.classList.add(`relevant`);
        element.classList.add((actualIndex++ % 2 == 0) ? `even` : `odd`);
      }
      else {
        element.classList.add(`irrelevant`);
      }
    }

    const allGroups = document.querySelectorAll(`.collection-group`);
    for (let i = 0 ; i < allGroups.length ; i++) {
      const relevantContent = allGroups[i].querySelectorAll(`.collection-item:not(.irrelevant)`);
      if (relevantContent.length > 0) {
        allGroups[i].classList.remove(`irrelevant`);
        allGroups[i].classList.add(`relevant`);
      }
      else {
        allGroups[i].classList.remove(`relevant`);
        allGroups[i].classList.add(`irrelevant`);
      }
    }
  }

  /*
   * Displays the full size picture once clicked on, with
   * navigation buttons and picture information labels.
   *
   * @access  private
   * @param   HTMLElement  element  the clicked element
   */
  async _asyncDisplayFullscreenPicture(element) {
    document.getElementById(`fullscreen-image`).src = this.imgPath + element.getAttribute(`item-file-name`);

    const infoDiv = document.getElementById(`fullscreen-infobox`);
    infoDiv.innerHTML = ``;
    const picInfosIds = [`item-date`,       `item-location`,       `item-description`,       `item-tags`];
    const  fsInfosIds = [`fullscreen-date`, `fullscreen-location`, `fullscreen-description`, `fullscreen-tags`];
    for (let i = 0 ; i < picInfosIds.length ; i++) {
      const value = element.getAttribute(picInfosIds[i]);
      if (value != null) {
        const p = document.createElement(`p`);
        p.setAttribute(`id`, fsInfosIds[i]);
        p.classList.add(`fullscreen-info`);
        p.innerHTML = value;
        infoDiv.appendChild(p);
      }
    }

    /*
     * Calculating the index of the HTML element among the
     * actually displayed pictures (collection minus those
     * hidden).
     */
    const allElements = Array.from(document.querySelectorAll(`.collection-item:not(.irrelevant)`));
    const htmlIndex = allElements.indexOf(element);

    function prev() {
      const prevHtmlIndex = (htmlIndex + allElements.length - 1) % allElements.length;
      const prevElement = allElements[prevHtmlIndex];
      this._asyncDisplayFullscreenPicture(prevElement);
    }

    function next() {
      const nextHtmlIndex = (htmlIndex + 1) % allElements.length;
      const nextElement = allElements[nextHtmlIndex];
      this._asyncDisplayFullscreenPicture(nextElement);
    }

    const boundPrev = prev.bind(this);
    const boundNext = next.bind(this);

    PageUtil.bindOnClick(`#btn-fs-prev`, function() {boundPrev()});
    PageUtil.bindOnClick(`#btn-fs-next`, function() {boundNext()});
  }

  /**
   * Returns the value into a format suitable to the speci-
   * fied attribute.
   *
   * @access  private
   * @param   string     attributeName  the name of the at-
   *                                    tribute
   * @param   string     value          the unformatted va-
   *                                    lue
   * @param   boolean    flatten        if the value has to
   *                                    be flattened (lower
   *                                    case and unaccent-
   *                                    uated)
   * @param   TransMode  transMode      NONE if no transla-
   *                                    tion is needed,
   *                                    CURRENT for current
   *                                    language only, ALL
   *                                    for a concatenation
   *                                    of all translations
   * @param   Boolean    html           indicates the re-
   *                                    sult is in html
   *                                    format and can
   *                                    contain html tags
   * @return  string                    the formatted value
   */
  async _asyncBeautify(attributeName, value, flatten = false, transMode = CollUtil.TransMode.NONE, html = false) {
    const split = this.needsJoining.includes(attributeName) || this.needsHashtag.includes(attributeName);
    const splitted = split ? value.split(`;`) : [value];
    let allValues = [];

    /*
     * Only neet to translate if not in html mode or if all
     * translations are asked cause data-i18n can then not
     * be used.
     */
    if (this.needsTranslation.includes(attributeName)) {
      if ((html && transMode === CollUtil.TransMode.ALL) || (!html && CollUtil !== CollUtil.TransMode.NONE)) {
        const langs = (transMode === CollUtil.TransMode.ALL) ? Translator.AVAILABLE_LANG() : [this.pageBuilder.translator.lang];

        for (let i = 0 ; i < splitted.length ; i++) {

          for (let j = 0 ; j < langs.length ; j++) {
            const valueI18nCode = `${TextUtil.toDashCase(attributeName)}.${splitted[i]}`;
            let translation = await this._pageBuilder.translator.asyncGetTranslatedWord(valueI18nCode, langs[j]);

            /*
             * Only pushing if translation is correct in non-
             * html mode.
             */
            if (!html && translation.includes(`translation-error`)) {
              allValues.push(valueI18nCode);
            }
            else {
              allValues.push(translation);
            }
          }
        }
      }
      /*
       * Only adding i18n html attribute if result is html
       * and translation in current language only. No need
       * to translate because it will be done automatically
       * by the PageBuilder when page is loaded.
       */
      else if (html && transMode === CollUtil.TransMode.CURRENT) {
        allValues = splitted.map(val => `<span data-i18n=${TextUtil.toDashCase(attributeName)}.${val}></span>`);
      }
    }
    /*
     * For non-translation cases.
     */
    else {
      allValues = splitted;
    }

    /*
     * Eliminating duplicates.
     */
    allValues = [...new Set(allValues)];

    var value = ``;
    if (this.needsHashtag.includes(attributeName)) {
      value = allValues.map(val => `#${val}`).join(" ");
    }
    else {
      value = allValues.join(`, `);
    }

    if (flatten) {
      value = TextUtil.flattenString(value);
    }

    return value;
  }
}