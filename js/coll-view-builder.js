import      PageUtil from "/js/page-util.js";
import      TextUtil from "/js/text-util.js";
import * as CollUtil from "/js/coll-util.js";

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
    this._name               = name;
    this._pageBuilder        = pageBuilder;

    this._apiPath            = `/api/collection/get-collection.php?name=${this.name}`;
    this._iconsJsonPath      = `/json/icons.json`;
    this._imgPath            = `/images/${name}/`

    this._redrawLocked       = false;

    this._collection         = null;
    this._sortableAttributes = [];
    this._currDateDirection  = CollUtil.Direction.ASC;
  }

  get name()                 {return this._name;}
  get pageBuilder()          {return this._pageBuilder;}

  get apiPath()              {return this._apiPath;}
  get iconsJsonPath()        {return this._iconsJsonPath;}
  get imgPath()              {return this._imgPath;}

  get redrawLocked()         {return this._redrawLocked;}

  get collection()           {return this._collection;}
  get sortableAttributes()   {return this._sortableAttributes;}
  get currSortingAttribute() {return this._currSortingAttribute;}
  get currSortingDirection() {return this._currSortingDirection;}
  get currGrouping()         {return this._currGrouping;}
  get currDateDirection()    {return this._currDateDirection;}

  _redrawLock()   {this._redrawLocked = true;}
  _redrawUnlock() {this._redrawLocked = false;}

  set collection          (collection)           {this._collection           = collection;}
  set sortableAttributes  (sortableAttributes)   {this._sortableAttributes   = sortableAttributes;}
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
  async asyncDrawAll(container, displayMode = CollUtil.DisplayMode.GALLERY, sortingAttribute, sortingDirection, grouping, dateDirection) {
    /*
     * Initializes the collection before anything is done.
     */
    await this._asyncGetCollection();

    await this._asyncDrawToolbarView(container, displayMode);
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
                     displayMode =      CollUtil.DisplayMode.GALLERY,
                     sortingAttribute = CollUtil.DATE,
                     sortingDirection = CollUtil.Direction.ASC,
                     grouping =         CollUtil.Grouping.NOT_GROUPED,
                     dateDirection =    CollUtil.Direction.ASC) {

    if (!this.redrawLocked) {
      this._redrawLock();

      container = PageUtil.getUniqueElement(container);
      sortingAttribute = this.sortableAttributes.includes(sortingAttribute) ? sortingAttribute : CollUtil.DATE;
      dateDirection = (sortingAttribute === CollUtil.DATE ? sortingDirection : dateDirection);

      PageUtil.fadeOut(`#collection-content`, true);
      const content = document.getElementById(`collection-content`);
      if (content) {
        await PageUtil.asyncWaitForIt(250);
        content.parentNode.removeChild(content);
      }

      await this._asyncGetCollection();
      await this._asyncSort(sortingAttribute, sortingDirection, grouping, dateDirection);

      switch (displayMode) {
        case CollUtil.DisplayMode.GALLERY:
          await this._asyncDrawGalleryView(container, grouping);
          break;

        case CollUtil.DisplayMode.DETAILS:
          await this._asyncDrawDetailsView(container, grouping);
          break;
      }

      await this._pageBuilder.translator.asyncTranslatePage();
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
   * @param   DisplayMode  displayMode  the type of view to
   *                                    draw
   */
  async _asyncDrawToolbarView(container, displayMode) {
    const toolbar = document.createElement(`div`);
    toolbar.classList.add(`collection-toolbar`);

    switch (displayMode) {
      case CollUtil.DisplayMode.GALLERY:
        const input = document.createElement(`input`);
        toolbar.appendChild(input);

        const toolbarButtonContainer = document.createElement(`div`);
        toolbarButtonContainer.setAttribute(`id`, `collection-toolbar-button-container`);
        toolbarButtonContainer.classList.add(`button-container`, `right-side`);

        const response = await fetch(this.iconsJsonPath);
        const icons = await response.json();

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

          await this._asyncRedraw(container, displayMode, selectedSortingAttribute, selectedDirection, selectedGrouping, selectedDateDirection);
        }

        async function changeDateDirection() {
          if (this.currSortingAttribute !== CollUtil.DATE) {
            await this._asyncRedraw(container, displayMode, this.currSortingAttribute, this.currSortingDirection, this.currGrouping, this.currDateDirection.next);
          }
        }

        const boundChangeSorting = changeSorting.bind(this);
        const boundChangeDateDirection = changeDateDirection.bind(this);

        for (let i = 0 ; i < this.sortableAttributes.length ; i++) {
          let sorting = this.sortableAttributes[i];

          const button = document.createElement(`i`);
          button.setAttribute(`id`, `btn-sorting-${sorting}`);
          button.classList.add(`material-icons`, `button`);

          PageUtil.bindOnClick(button, function() {boundChangeSorting(sorting);});
          PageUtil.bindOnRightClick(button, sorting === CollUtil.DATE ? function() {boundChangeDateDirection();} : function() {});

          let iconName = TextUtil.getJsonValue(sorting, icons);
          if (!iconName) {iconName = TextUtil.getJsonValue(`default`, icons);}
          button.innerHTML = iconName;

          const iconNotifContainer = document.createElement(`div`);
          iconNotifContainer.classList.add(`icon-notif-container`)
          iconNotifContainer.appendChild(button);
          toolbarButtonContainer.appendChild(iconNotifContainer);
        }

        toolbar.appendChild(toolbarButtonContainer);
        break;

      case CollUtil.DisplayMode.DETAILS:
        // TODO
        break;
    }

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
    fsView.setAttribute(`id`, `polaroid-fullscreen`);
    document.body.appendChild(fsView);
    await PageUtil.replaceElementWithTemplate(`#polaroid-fullscreen`);
    PageUtil.bindOnClick(`#btn-fs-close`,  function() {PageUtil.fadeOut(`#polaroid-fullscreen`);});
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

    /*
     * Translates the groups so that they are ordered pro-
     * perly.
     */
    async function translateGroups(sortingAttribute, grouping) {
      const length = (await this._asyncGetCollection()).length;
      for (let i = 0 ; i < length ; i++) {
        const item = JSON.parse((await this._asyncGetCollection())[i]);
        let translatedGroup = ``;
        switch (sortingAttribute) {
          case CollUtil.DATE:
            translatedGroup = item[sortingAttribute].substring(0, 4);
            break;

          default:
            translatedGroup = await this._pageBuilder.translator.asyncGetTranslatedWord(`${sortingAttribute}.${item[sortingAttribute]}`);
            break;
        }
        item[`translatedGroup`] = translatedGroup;
        (await this._asyncGetCollection())[i] = JSON.stringify(item);
      }
    }

    const boundTranslateGroups = translateGroups.bind(this);
    await boundTranslateGroups(sortingAttribute, grouping);

    this.collection.sort(function (x, y) {
      const jsonX = JSON.parse(x);
      const jsonY = JSON.parse(y);

      /*
       * No need to use the groups to sort the dates as
       * collection is sorted by date anyway below.
       */
      if (!(sortingAttribute === CollUtil.DATE)) {
        const groupX = jsonX[`translatedGroup`];
        const groupY = jsonY[`translatedGroup`];

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
   * @param   Grouping   grouping     if the items have to
   *                                  be grouped or not
   */
  async _asyncDrawGalleryView(container, grouping) {
    /*
     * Temporary container to hold the view.
     */
    let view = document.getElementById(`collection-content`);
    view = view ? view : document.createElement(`div`);
    view.setAttribute(`id`, `collection-content`);
    view.classList.add(`fadable`);
    container.appendChild(view);

    const collection = await this._asyncGetCollection();

    let group = document.createElement(`div`);
    group.setAttribute(`id`, `polaroid-group-`)
    group.classList.add(`polaroid-group`);
    let openGroup = ``;

    let groupContent = document.createElement(`div`);
    groupContent.classList.add(`polaroid-group-content`);
    group.appendChild(groupContent);

    const cvb = this;
    const _boundAsyncDisplayFullscreenPicture = this._asyncDisplayFullscreenPicture.bind(this);

    for (let i = 0 ; i < collection.length ; i++) {
      const picture = JSON.parse(collection[i]);

      if (grouping === CollUtil.Grouping.GROUPED) {
        const currGroup = picture[`translatedGroup`];
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
          group.setAttribute(`id`, `polaroid-group-${currGroup}`);
          group.classList.add(`polaroid-group`);

          const title = document.createElement(`h1`);
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
      const frame = document.createElement(`div`);
      frame.classList.add(`polaroid-frame`);

      frame.onclick = function() {
        const clicked = this.querySelector(`img`);
        const index = parseInt(clicked.getAttribute(`index`));
        _boundAsyncDisplayFullscreenPicture(index);
        PageUtil.fadeIn(`#polaroid-fullscreen`);
      };

      /*
       * Picture inset box-shadow wrapper.
       * @link https://stackoverflow.com/questions/61961334/css-img-inset-box-shadow-trick-center-vh-anchor-max-height
       */
      const a = document.createElement(`a`);
      a.setAttribute(`href`, `#`);
      a.classList.add(`dummy-link`, `polaroid-shadow`);

      /*
       * Picture.
       */
      const img = document.createElement(`img`);
      /*
       * Index is used to retrieve info from collection
       * when clicked (see onclick above).
       */
      img.classList.add(`polaroid-image`);
      img.setAttribute(`index`, i);
      img.src = `${this.imgPath}${picture.fileName}`;

      /*
       * Adding picture to frame and frame to temporary container.
       */
      a.appendChild(img);
      frame.appendChild(a);
      groupContent.appendChild(frame);
    }

    view.appendChild(group);
  }

  /*
   * Displays the full size picture once clicked on, with
   * navigation buttons and picture information labels.
   *
   * @access  private
   * @param   int      the index (in the collection) of the
   *                    picture to display
   */
  async _asyncDisplayFullscreenPicture(index) {
    const collection = await this._asyncGetCollection();
    const jsonItem = JSON.parse(collection[index]);

    document.getElementById(`fullscreen-image`).src = `${this.imgPath}${jsonItem.fileName}`;

    const infoDiv = document.getElementById(`fullscreen-infobox`);
    infoDiv.innerHTML = ``;
    const jsonInfoArray = [CollUtil.READABLE_DATE, CollUtil.LOCATION,     CollUtil.DESCRIPTION];
    const htmlInfoArray = [`fullscreen-date`,      `fullscreen-location`, `fullscreen-description`];
    for (let i = 0 ; i < jsonInfoArray.length ; i++) {
      const value = jsonItem[jsonInfoArray[i]];
      if (value != null) {
        const p = document.createElement(`p`);
        p.setAttribute(`id`, htmlInfoArray[i]);
        p.classList.add(`fullscreen-info`);
        p.innerHTML = value;
        infoDiv.appendChild(p);
      }
    }

    function prev(index) {
      const prevIndex = (index + collection.length - 1) % collection.length;
      this._asyncDisplayFullscreenPicture(prevIndex);
    }

    function next(index) {
      const nextIndex = (index + 1) % collection.length;
      this._asyncDisplayFullscreenPicture(nextIndex);
    }

    const boundPrev = prev.bind(this);
    const boundNext = next.bind(this);

    PageUtil.bindOnClick(`#btn-fs-prev`, function() {boundPrev(index)});
    PageUtil.bindOnClick(`#btn-fs-next`, function() {boundNext(index)});
  }
}
