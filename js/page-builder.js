import PageUtil, {Menu} from "/js/page-util.js";
import TextUtil         from "/js/text-util.js";
import TitleElement     from "/js/title-element.js"
import Translator       from "/js/translator.js";

`use strict`

class SystemMenu extends Menu {}

/**
 * Helper class used to build a page.
 *
 * Builds the basic HTML using templates which folder is
 * specified. Then translates content using a Translator.
 * Then binds common events. Finally fades the page in when
 * everything is over.
 */
export default class PageBuilder {
  /**
   * PageBuilder constructor.
   *
   * @param  string  title          title of the page
   * @param  string  root           root of the website
   * @param  string  templatesPath  path to the folder con-
   *                                taining the templates
   *                                (without the root)
   * @param  string  menuPath       path to the json file
   *                                describing the menu
   */
  constructor(title, root, templatesPath = `/templates`, menuPath = `/json/menu.json`) {
    this._url           = TextUtil.formatUrl(window.location.href);
    this._title         = title;
    this._root          = root;
    this._templatesPath = templatesPath;
    this._menuPath      = menuPath;
    this._translator    = new Translator();
    this._onResizeFuncs = new Set();
  }

  get url()           {return this._url;}
  get title()         {return this._title;}
  get root()          {return this._root;}
  get templatesPath() {return this._templatesPath;}
  get menuPath()      {return this._menuPath;}
  get translator()    {return this._translator;}
  get onResizeFuncs() {return this._onResizeFuncs;}

  /**
   * Builds the page.
   *
   * Builds the basic HTML using templates located in fol-
   * der specified in constructor. Then translates content
   * using a Translator. Then binds common events. Finally,
   * fades the page in when everything is over.
   */
  async asyncBuildPage() {
    await this._drawHead();

    const toBeTemplated = [`header`, `aside`, `footer`];
    for (let i = 0 ; i < toBeTemplated.length ; i++) {
      if (document.querySelector(toBeTemplated[i]) !== null) {
        await PageUtil.replaceElementWithTemplate(toBeTemplated[i]);
      }
    }
    document.querySelector(`main`).setAttribute(`id`, `main-panel`);

    if (this.menuPath != null && document.querySelector(`nav`)) {
      const htmlMenu = await this._buildHtmlMenu();
      PageUtil.replaceElementWithHtml(`nav`, htmlMenu);
    }

    await this._asyncDrawSystemMenu();

    await this.translator.asyncTranslatePage();

    PageUtil.bindOnClick(`#btn-menu`, function() {
      document.querySelector(`aside`).classList.toggle(`clicked`);
      window.dispatchEvent(new Event('resize'));
    });

    PageUtil.bindOnClick(`#btn-system`, function(e) {
      this.displayCtxMenu(e, `#ctx-system`);
    }.bind(this));

    this.onResizeFuncs.add(this.displayCtxMenu);
    function onResizeAll() {
      [...this.onResizeFuncs].forEach(func => {
        const boundFunc = func.bind(this);
        boundFunc();
      });
    };
    window.onresize = function() {
      const boundOnResizeAll = onResizeAll.bind(this);

      const width   = window.innerWidth;
      const wHeight = window.innerHeight;
      boundOnResizeAll();
      setTimeout(function() {boundOnResizeAll();}, 250);

    }.bind(this);

    /*
     * Override default behavior when leaving a page.
     *
     * @link https://stackoverflow.com/questions/1760096/override-default-behaviour-for-link-a-objects-in-javascript
     */
    document.onclick = function (e) {
      e = e || window.event;
      const element = e.target || e.srcElement;

      if (element.tagName == `A`) { // Capital `A`, not `a`.
        e.preventDefault();
        const goTo = element.href;

        /*
         * If it's a fake link, like the ones used in
         * .picture-shadow, we do nothing.
         */
        if (!element.classList.contains(`dummy-link`)) {
          PageUtil.fadeOut(document.body);

          /*
           * Wait for a while to let css transition terminate.
           */
          setTimeout(function () {
            window.location = goTo;
          }, 250);
        }
      }
    }

    PageUtil.fadeIn(document.body);
  }

  /**
   * Draws document head by adding template head to cur-
   * rent page head.
   *
   * Also orders the different entries.
   *
   * @access  private
   */
  async _drawHead() {
    let head = document.createElement(`head`);
    const title = document.createElement(`title`);
    title.innerHTML = this.title;
    head.appendChild(title);

    /*
     * We add both the head of the current page and the
     * content of the template in the temporary head.
     * PageUtil.replaceElementWithTemplate cannot be used
     * here because head is outside DOM. 
     */
    head.innerHTML += await PageUtil.getTemplateText(`head`);
    head.innerHTML += document.head.innerHTML;

    /*
     * elements is a NodeList it needs to be an array to be
     * sorted.
     */
    const elements = Array.from(head.querySelectorAll(`head *`));

    /*
     * Explicit declaration so we can bind this to it.
     */
    function compareElements(x, y) {
      const orderX = TitleElement.from(x).index;
      const orderY = TitleElement.from(y).index;

      if (orderX != orderY) {
        return orderX - orderY;
      }
      else {
        return x.outerHTML.localeCompare(y.outerHTML);
      }
    }
    elements.sort(compareElements.bind(this));

    document.head.innerHTML = ``;
    for (let i = 0 ; i < elements.length ; i++) {
      document.head.appendChild(elements[i]);
    }
  }

  /**
   * Draws the system menu and the elements necessary for
   * the various contextual menus.
   */
  async _asyncDrawSystemMenu() {
    const contextualWrapper = document.createElement(`div`);
    contextualWrapper.setAttribute(`id`, `contextual-wrapper`);
    contextualWrapper.classList.add(`hidden`);
    document.body.appendChild(contextualWrapper);
  
    PageUtil.bindOnClick(contextualWrapper, function() {
      this.displayCtxMenu();
    }.bind(this));

    new SystemMenu(`system-change-language`, `change-language`, `label.change-language`, function() {
      const boundAsyncSwitchLanguage = this.translator.asyncSwitchLanguage.bind(this.translator);
      boundAsyncSwitchLanguage();
      this.displayCtxMenu();
    }.bind(this), null);

    new SystemMenu(`system-show-errors`, `show-errors`, `label.show-errors`, function() {
      const errorsCss = document.querySelector("link[href='/css/errors.css']");
      errorsCss.disabled = !errorsCss.disabled;
      if (errorsCss.disabled) {
        document.getElementById(`system-show-errors`).classList.remove(`active`);
      }
      else {
        document.getElementById(`system-show-errors`).classList.add(`active`);
      }
      this.displayCtxMenu();
    }.bind(this), null);
    SystemMenu.lock();
    document.body.appendChild(await SystemMenu.asyncBuild(`ctx-system`));
  }

  /**
   * Displays a contextual menu.
   *
   * @param  Event        e          the event leading to
   *                                 the function call
   * @param  HTMLElement  elemOrSel  the contextual menu
   */
  displayCtxMenu(e, elemOrSel) {
    [...document.getElementsByClassName(`contextual menu`)].forEach(element => PageUtil.fadeOut(element));

    if (elemOrSel) {
      e = e || window.event;
      const clicked = e.target || e.srcElement;
      document.getElementById(`contextual-wrapper`).classList.remove(`hidden`);
      const ctxMenu = PageUtil.getUniqueElement(elemOrSel);
      ctxMenu.setAttribute(`clicked`, clicked.getAttribute(`id`));
      this._positionCtxMenu(elemOrSel);
      PageUtil.fadeIn(ctxMenu);
    }
    else {
      document.getElementById(`contextual-wrapper`).classList.add(`hidden`);
    }
  }

  /**
   * Positions the contextual menu.
   *
   * @access  private
   * @param   HTMLElement  elemOrSel  the contextual menu
   */
  _positionCtxMenu(elemOrSel) {
    const ctxMenu = PageUtil.getUniqueElement(elemOrSel);
    if (ctxMenu.hasAttribute(`clicked`)) {
      const clicked = document.getElementById(ctxMenu.getAttribute(`clicked`));

      const wWidth  = window.innerWidth;
      const wHeight = window.innerHeight;

      const cs = window.getComputedStyle(clicked);
      const marginTop    = parseInt(cs.marginTop.replace(`px`, ``));
      const marginBottom = parseInt(cs.marginBottom.replace(`px`, ``));

      const menuWidth = ctxMenu.getBoundingClientRect().width;

      const bcr = clicked.getBoundingClientRect();
      const leftSpace   = bcr.right;
      const rightSpace  = wWidth - bcr.left;
      const topSpace    = bcr.top;
      const bottomSpace = wHeight - bcr.bottom;

      let [left, right, top, bottom] = [null, null, null, null];

      /**
       * If there is enough space to put the menu on the
       * right, we do it.
       * Otherwise, if there is enough space to put it on
       * the left, we do it.
       * Otherwise, we put it on the right anyway.
       */
      if (rightSpace > menuWidth || leftSpace <= menuWidth) {
        left = bcr.left;
      }
      else {
        right = wWidth - bcr.right;
      }

      if (topSpace > bottomSpace) {
        bottom = wHeight - bcr.top + marginTop;
      }
      else {
        top = bcr.bottom + marginBottom;
      }

      const positions = [{left}, {right}, {top}, {bottom}];
      for (let i = 0 ; i < positions.length ; i++) {
        const positionName = Object.keys(positions[i])[0];
        let positionValue = positions[i][positionName];
        positionValue = positionValue ? `${positionValue}px` : `auto`;
        ctxMenu.style.setProperty(positionName, positionValue);
      }
    }
  }

  /**
   * Repositions all contextual menus.
   */
  _repositionCtxMenus() {
    [...document.getElementsByClassName(`contextual menu`)].forEach(element => this._positionCtxMenu(element));
  }



  /**
   * Builds a menu with the specified json file.
   *
   * Builds an unordered nested list representing the web-
   * site menu by browsing the specified json file.
   *
   * TODO: Currently limited to a list of depth 2, update
   * code.
   * @access  private
   */
  async _buildHtmlMenu() {
    const response = await fetch(this.menuPath);
    const json = await response.json();

    /*
     * Examining current URL to determine which menu
     * options to display or hide. See below.
     */
    const escapedRoot = this.root.replace(/[.\/]/g, `\\$&`); // $& means the whole matched string
    const regexString = `${escapedRoot}(([a-z\-\/]*\/)*[a-z\-]*\/)`;
    const regex       = new RegExp(regexString, `g`);
    const matches     = regex.exec(this.url);

    /*
     * All top-level menu items will be displayed, plus
     * all `children` (items whose parent is the cur-
     * rent page) and `siblings` (items whose parent is
     * the same as current page's parent.
     *
     * if url = `http://website.com/sub/sub-sub/page`
     * href   = `/sub/sub-sub/page`
     * parent = `/sub/sub-sub`
     *
     * Values for current pages:
     */
    const currUrl    = TextUtil.formatUrl(matches[0]);
    const currHref   = TextUtil.formatUrl(matches[1]);
    const currParent = TextUtil.formatUrl(matches[2] === undefined ? `` : matches[2]);

    const nav = document.createElement(`nav`);
    /*
     * ul1 is the base level ul
     */
    const ul1 = document.createElement(`ul`);
    ul1.setAttribute(`id`, `menu-nav`);
    ul1.classList.add(`menu`, `menu-level`);
    nav.appendChild(ul1);

    /*
     * Keeps the parent of the previous menu item, used
     * to know if the current item should be in the
     * same submenu or not.
     */
    let prevParent = ``;

    /*
     * Temporary ul element used to create nested me-
     * nus.
     */
    let currUl = null;
    for(let i = 0 ; i < json.length ; i++) {
      const item = json[i];
      const itemParent = TextUtil.formatUrl(item[`parent`]);
      const itemHref   = TextUtil.formatUrl(item[`href`]);

      /*
       * Careful, using formatUrl, menu items having no
       * parent (empty string) will instead have `/` as
       * parent. But the homepage's href is also `/`,
       * so some items will be considered as both chil-
       * dren and sibling. Watch out for side effects.
       */
      const base    = itemParent === `/`;
      const child   = itemParent === currHref;
      const sibling = itemParent === currParent;

      /*
       * The json item is the page actually being dis-
       * played.
       */
      const active  = itemHref   === currHref;
      if (base || child || sibling) {
        const levelChange = itemParent != prevParent;
        const prevSubmenu = !(currUl === null);
        const currSubmenu = itemParent != `/`;

        /*
         * If we are changing menu level...
         */
        if (levelChange) {

          /*
           * If we were creating a submenu, we add it 
           * to the main menu and reset ul to be the
           * main menu...
           */
          if (prevSubmenu) {
            ul1.appendChild(currUl);
            currUl = null;
          }

          /*
           * If current item is in a submenu as well,
           * we open a new one.
           */
          if (currSubmenu) {
            currUl = document.createElement(`ul`);
            currUl.classList.add(`menu-level`);
          }
        } // end if (levelChange)

        /*
         * Actually adding item to ul, which is either
         * the base menu or the submenu currently being
         * built. Items look like this:
         * <li class=`active`><i class=`material-icon`>itemIcon</i><a href=itemHref data-i18n=itemI18n></a></li>
         */
        const itemIcon = item[`material-icon`];
        const itemI18n = item[`data-i18n`];

        const li = document.createElement(`li`);
        li.setAttribute(`style`, `--level: ${currSubmenu ? 1 : 0}`);
        li.classList.add(`menu-item`);
        if (active) {
          li.classList.add(`active`);
        }

        const img = document.createElement(`i`);
        img.classList.add(`material-icons`, `icon`);
        img.innerHTML = itemIcon;

        const a = document.createElement(`a`);
        a.setAttribute(`href`, itemHref)
        a.setAttribute(`data-i18n`, itemI18n);

        const label = document.createElement(`label`);
        label.appendChild(a);

        li.appendChild(img);
        li.appendChild(label);
        (currUl === null) ? ul1.appendChild(li) : currUl.appendChild(li);

        /*
         * Now moving to the next item, so updating
         * previous parent.
         */
        prevParent = itemParent;
      } // end if (base || child || sibling)
    } // end for

    /*
     * If we ended in a submenu we need to append it to
     * the main menu before returning.
     */
    if (!(currUl === null)) {
      ul1.appendChild(ul);
    }

    return nav.outerHTML;
  }
}