import PageUtil   from "/js/page-util.js";
import TextUtil   from "/js/text-util.js";
import Translator from "/js/translator.js";

`use strict`

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
  constructor(title, root, templatesPath, menuPath) {
    this._url        = TextUtil.formatUrl(window.location.href);
    this._title      = title;
    this._root       = root;
    this._templates  = templatesPath;
    this._menuPath   = menuPath;
    this._translator = new Translator();
  }

  /**
   * Builds the page.
   *
   * Builds the basic HTML using templates which folder is
   * specified. Then translates content using a Translator.
   * Then binds common events. Finally fades the page in when
   * everything is over.
   *
   * @return  Promise
   */
  buildPage() {
    var translator = this._translator;
    return this._drawHead()
      /*
       * Replacing placeholder elements with tags.
       */
      .then(() => this._drawElement(`header`))
      .then(() => this._drawElement(`footer`))
      .then(() => this._drawElement(`aside`))

      /*
       * Injecting json menu if specified.
       */
      .then(() => (this._menuPath === undefined) ? null : this._buildHtmlMenu().then((htmlMenu) => this._drawElement(`nav`, htmlMenu)))

      /*
       * Once all content is loaded, translating the page.
       */
      .then(() => this._translator.translatePage())

      /*
       * Binding events.
       */
      .then(() => PageUtil.bindOnclick(`#btn-translate`, function() {translator.switchLanguage(translator)}))

      /*
       * Override default behavior when leaving a page.
       *
       * @link https://stackoverflow.com/questions/1760096/override-default-behaviour-for-link-a-objects-in-javascript
       */
      .then(() => {
        document.onclick = function (e) {
          e = e || window.event;
          var element = e.target || e.srcElement;

          if (element.tagName == `A`) { // Capital `A`, not `a`.
            /*
             * Prevents default <a> behavior.
             */
            e.preventDefault();

            /*
             * Stores target url.
             */
            var goTo = element.href;
            PageUtil.fadeOut(document.body);

            /*
             * Wait for a while to let css transition terminate.
             */
            setTimeout(function () {
              /*
               * Navigate to intended destination
               */
              window.location = goTo;
            }, 250);
          }
        }
      })

      /*
       * Fading the page in once averything is ready.
       */
      .then(() => PageUtil.fadeIn(document.body))
  }

  /**
   * Draws document head by adding template head to cur-
   * rent page head.
   *
   * Also orders the different items.
   *
   * @access  private
   */
  async _drawHead() {
    var head = document.createElement(`head`);
    var title = document.createElement(`title`);
    title.innerHTML = this._title;
    head.appendChild(title);
    /*
     * We add both the head of the current page and the
     * content of the template in the temporary head.
     */
    head.innerHTML += document.head.innerHTML;
    head.innerHTML += await TextUtil.getFileText(`${this._templates}/head.html`);

    /*
     * elements is a NodeList it needs to be an array to be
     * sorted.
     */
    var elements = Array.from(head.querySelectorAll(`head *`));

    /*
     * Explicit declaration so we can bind this to it.
     */
    function compareElements(x, y) {
      var orderX = this._headOrder(x);
      var orderY = this._headOrder(y);

      /*
       * Either those are two different type of elements
       * and we order them using the _headOrder function...
       */
      if (orderX != orderY) {
        return orderX - orderY;
      }
      /*
       * ...or we simply order them alphabetically if they
       * are the same type.
       */
      else {
        return x.outerHTML.localeCompare(y.outerHTML);
      }
    }
    elements.sort(compareElements.bind(this));

    /*
     * Finally we "clean" document head, an re-write it
     * with the ordered elements.
     */
    document.head.innerHTML = ``;
    for (let i = 0 ; i < elements.length ; i++) {
      document.head.appendChild(elements[i]);
    }
  }

  /**
   * Returns the expected order of head HTMLElements.
   *
   * Used to compare and sort HTMLElements.
   * @see     PageBuilder._drawHead()
   *
   * @access  private
   * @param   HTMLElement  element  the element which order
   *                                we want to know
   * @return  int                   the order of the ele-
   *                                ment
   */
  _headOrder(element) {
    var order = 999;

    switch (element.tagName) {
      case `TITLE`:
        order = 100;
        break;

      case `META`:
        switch (element.name) {
          case `description`:
            order = 101;
            break;

          case `author`:
            order = 102;
            break;

          case ``:
            order = 199;
            break;
        }

      case `LINK`:
        switch (element.rel) {
          case `stylesheet`:
            order = 201;
            break;

          case `icon`:
            order = 202;
            break;
        }
        break;

      case `STYLE`:
        order = 300;
        break;

      case `SCRIPT`:
        switch (element.type) {
          case `module`:
            order = 401;
            break;

          case ``:
            order = 499;
            break;
        }
        break;
    }

    return order;
  }

  /**
   * Fills a placeholder element with the content of a tem-
   * plate.
   *
   * Fills the innerHTML of a placeholder element, for
   * example <header></header>, with the html specified.
   * The element is accessed using the specified selector.
   * If no html is specified, will use the selector to
   * fetch the template of the same name and return its
   * html. Does nothing if the specified tag is not found,
   * or if there are multiple elements returned with the
   * selector. Does nothing either if the template is not
   * found.
   *
   * @access  private
   * @param   string   selector   selector used to find the
   *                              element which html is to
   *                              be replaced
   * @param   string   html       the html to inject in the
   *                              element, if null, it will
   *                              be used to look for a
   *                              template whose name is
   *                              the selector
   */
   async _drawElement(selector, html) {
    var oldElement = PageUtil.getUniqueElement(selector);
    if (oldElement) {
      if (html === undefined) {
        html = await TextUtil.getFileText(`${this._templates}/${selector}.html`);
      }

      var newElement = document.createElement(`div`);
      newElement.innerHTML = html;

      while (newElement.firstChild) {
        oldElement.appendChild(newElement.firstChild);
      }
    }
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
    * @return  Promise(string)  a promise containing the
    *                           menu in html/string format
    */
   _buildHtmlMenu() {
    return fetch(this._menuPath)
      .then((res)  => res.json())
      .then((json) => {
        /*
         * Examining current URL to determine which menu
         * options to display or hide. See below.
         */
        var escapedRoot = this._root.replace(/[.\/]/g, `\\$&`); // $& means the whole matched string
        var regexString = `${escapedRoot}(([a-z\-\/]*\/)*[a-z\-]*\/)`;
        var regex       = new RegExp(regexString, `g`);
        var matches     = regex.exec(this._url);

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
        var currUrl    = TextUtil.formatUrl(matches[0]);
        var currHref   = TextUtil.formatUrl(matches[1]);
        var currParent = TextUtil.formatUrl(matches[2] === undefined ? `` : matches[2]);

        var menu = document.createElement(`ul`);

        /*
         * Keeps the parent of the previous menu item, used
         * to know if the current item should be in the
         * same submenu or not.
         */
        var prevParent = ``;

        /*
         * Temporary ul element used t ocreate nested me-
         * nus.
         */
        var ul = null;
        for(var i = 0 ; i < json.length ; i++) {
          var item = json[i];
          var itemParent = TextUtil.formatUrl(item[`parent`]);
          var itemHref   = TextUtil.formatUrl(item[`href`]);

          /*
           * Careful, using formatUrl, menu items having no
           * parent (empty string) will instead have `/` as
           * parent. But the homepage's href is also `/`,
           * so some items will be considered as both chil-
           * dren and sibling. Watch out for side effects.
           */
          var base    = itemParent === `/`;
          var child   = itemParent === currHref;
          var sibling = itemParent === currParent;

          /*
           * The json item is the page actually being dis-
           * played.
           */
          var active  = itemHref   === currHref;
          if (base || child || sibling) {
            var levelChange = itemParent != prevParent;
            var prevSubmenu = !(ul === null);
            var currSubmenu = itemParent != `/`;

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
                menu.appendChild(ul);
                ul = null;
              }

              /*
               * If current item is in a submenu as well,
               * we open a new one.
               */
              if (currSubmenu) {
                ul = document.createElement(`ul`);
              }
            } // end if (levelChange)

            /*
             * Actually adding item to ul, which is either
             * the base menu or the submenu currently being
             * built. Items look like this:
             * <li class=`active`><i class=`material-icon`>itemIcon</i><a href=itemHref data-i18n=itemI18n></a></li>
             */
            var itemIcon = item[`material-icon`];
            var itemI18n = item[`data-i18n`];

            var li = document.createElement(`li`);
            if (active) {
              li.classList.add(`active`);
            }

            var img = document.createElement(`i`);
            img.classList.add(`material-icons`);
            img.innerHTML = itemIcon;

            var a = document.createElement(`a`);
            a.setAttribute(`href`,      itemHref)
            a.setAttribute(`data-i18n`, itemI18n);

            li.appendChild(img);
            li.appendChild(a);
            (ul === null) ? menu.appendChild(li) : ul.appendChild(li);

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
        if (!(ul === null)) {
          menu.appendChild(ul);
        }

        return menu.outerHTML;
      }) // end promise
   }
}