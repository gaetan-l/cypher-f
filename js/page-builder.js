import Translator  from "/js/translator.js";

`use strict`

/**
 * Helper class used to build a page.
 *
 * Builds the basic HTML using templates which folder is
 * specified. Then translates content using a Translator.
 * Then binds common events. Finally fades the page in when
 * everything is over.
 */
class PageBuilder {
  /**
   * PageBuilder constructor.
   *
   * @param title         title of the page
   * @param root          root of the website
   * @param templatesPath path to the folder containing
   *                      the templates (without the root)
   * @param menuPath      path to the json file describing
   *                      the menu
   */
  constructor(title, root, templatesPath, menuPath) {
    this._url        = this._formatUrl(window.location.href);
    this._title      = title;
    this._root       = root;
    this._templates  = templatesPath;
    this._menuPath   = menuPath;
    this._body       = document.body;
    this._header     = document.getElementsByTagName(`header`)[0];
    this._main       = document.getElementsByTagName(`main`)[0];
    this._footer     = document.getElementsByTagName(`footer`)[0];

    /**
     * Translator that will be used to translate the page
     * once built.
     */
    this._translator = new Translator();
  }

  /**
   * Builds the page.
   *
   * Builds the basic HTML using templates which folder is
   * specified. Then translates content using a Translator.
   * Then binds common events. Finally fades the page in when
   * everything is over.
   */
  buildPage() {
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
      .then(() => this._addLanguageButtonEvent(this._translator))
      .then(() => this._addFadeOutOnUnload(this))

      /*
       * Fading the page in once averything is ready.
       */
      .then(() => this.fadeIn(this._body))
  }

  /**
   * Fades element in.
   *
   * First removes fade-out class then adds fade-in class.
   * Transition effects to be defined in css.
   */
  fadeIn(element) {
    element.classList.remove(`fade-out`);
    element.classList.add(`fade-in`);
  }

  /**
   * Fades element out.
   *
   * First removes fade-in class then adds fade-out class.
   * Transition effects to be defined in css.
   */
  fadeOut(element) {
    element.classList.remove(`fade-in`);
    element.classList.add(`fade-out`);
  }

  _formatUrl(unformated) {
    return unformated.replace(/\/?$/, '/'); // Adds trailing slash
  }

  /*
   * Draws document head.
   */
  _drawHead() {
    var temp = document.createElement('div');
    return fetch(`/templates/head.html`)
      .then((res) => res.text())
      .then((templateHead) => {
        var title = `<title>${this._title}</title>`;
        var metaArray = document.getElementsByTagName(`meta`);
        var scriptArray = document.getElementsByTagName(`script`);
        temp.innerHTML = title;
        for (let i = 0 ; i < metaArray.length ; i++) {
          temp.innerHTML += metaArray[i].outerHTML
        }
        temp.innerHTML += templateHead;
        for (let i = 0 ; i < scriptArray.length ; i++) {
          temp.innerHTML += scriptArray[i].outerHTML
        }

        document.head.innerHTML = ``;
        while (temp.firstChild) {
          document.head.appendChild(temp.firstChild);
        }
      })
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
   *                              template of the same name
   */
   async _drawElement(selector, html) {
    var tags = document.querySelectorAll(selector);
    if (tags.length == 1) {
      if (html === undefined) {
        html = await this._getTemplateText(selector);
      }

      var oldElement = tags[0];
      var newElement = document.createElement(`div`);
      newElement.innerHTML = html;

      while (newElement.firstChild) {
        oldElement.appendChild(newElement.firstChild);
      }
    }
    else {
      console.warn(`${tags.length} elements found with selector ${selector} (should be 1).`);
    }
   }

   _getTemplateText(templateName) {
    var templatePath = `${this._templates}/${templateName}.html`;
    return fetch(templatePath)
      .then((response) => response.ok ? response.text() : null)
   }

   /**
    * Builds a menu with the specified json file.
    *
    * Builds an unordered nested list representing the web-
    * site menu by browsing the specified json file.
    */
   _buildHtmlMenu() {
    return fetch(this._menuPath)
      .then((res)  => res.json())
      .then((json) => {
        /*
         * Examining current URL to determine which menu
         * options to display or hide. See below.
         */
        var escapedRoot = this._root.replace(/[.\/]/g, '\\$&'); // $& means the whole matched string
        var regexString = `(?<url>${escapedRoot}(?<href>(?<parent>[a-z\-\/]*\/)*[a-z\-]*\/))`;
        var regex       = new RegExp(regexString, `g`);
        console.log(this._url);
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
        console.log(matches);
        var currUrl    = matches.groups.url;
        var currHref   = matches.groups.href;
        var currParent = matches.groups.parent === undefined ? `` : matches.groups.parent;

        var menu = document.createElement(`ul`);

        /*
         * Keeps the parent of the previous menu item, used
         * to know if the current item should be in the
         * same submenu or not.
         */
        var prevParent = ``;

        /*
         * Current ul element, starts with base menu, but
         * can become a nested ul in multi-level menus.
         */
        var ul = menu;
        for(var i = 0 ; i < json.length ; i++) {
          var item = json[i];
          var itemParent = this._formatUrl(item[`parent`]);
          var itemHref   = this._formatUrl(item[`href`]);

          var base    = itemParent === ``;
          var child   = itemParent === currHref;
          var sibling = itemParent === currParent;

          /*
           * The json item is the page actually being dis-
           * played.
           */
          var active  = itemHref   === currHref;
          if (base || child || sibling) {
            var levelChange = itemParent != prevParent;
            var prevSubmenu = ul != menu;
            var currSubmenu = itemParent != ``;

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
                while (ul.firstChild) {
                  menu.appendChild(ul.firstChild);
                }
                ul = menu;
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
            ul.appendChild(li);

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
        if (ul != menu) {
          while (ul.firstChild) {
            menu.appendChild(ul.firstChild);
          }
        }

        return menu.outerHTML;
      }) // end promise
   }

  /*
   * Adds translation button onclick event.
   */
  _addLanguageButtonEvent(translator) {
    document.getElementById(`language-button`).onclick = function() {
      translator.switchLanguage(translator);
    };
  }

  /*
   * Page fades out on unload.
   * Courtesy of: https://stackoverflow.com/questions/1760096/override-default-behaviour-for-link-a-objects-in-javascript
   */
  _addFadeOutOnUnload(pageBuilder) {
    /* Courtesy of: https://stackoverflow.com/questions/1760096/override-default-behaviour-for-link-a-objects-in-javascript */
    document.onclick = function (e) {
      e = e || window.event;
      var element = e.target || e.srcElement;

      if (element.tagName == `A`) { // capital `A`, not `a`
        e.preventDefault(); // prevent default anchor behavior
        var goTo = element.href; // store target url
        pageBuilder.fadeOut(pageBuilder._body);;

        setTimeout(function () {
          window.location = goTo; // navigate to destination
        }, 250);
      }
    }
  }
}

export default PageBuilder;