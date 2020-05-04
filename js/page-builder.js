import Translator  from "/js/translator.js";

`use strict`

class PageBuilder {
  constructor() {
    this._translator = new Translator();
    this._title      = `Cypher`;
    this._body       = document.body;
    this._main       = document.getElementsByTagName(`main`)[0];
    this._url        = window.location.href;
  }

  /*
   * Builds the various elements of the page using
   * templates, adds buttons and events and translates
   * it and fades it in when ready.
   */
  buildPage() {
    return this._drawHead()
      .then(() => this._drawFooter())
      .then(() => fetch(`/json/menu.json`))
      .then((res) => res.json())
      .then((jsonMenu) => this._drawNav(jsonMenu))
      .then(() => this.translatePage())
      .then(() => this._addLanguageButtonEvent(this._translator))
      .then(() => this._addFadeOutOnUnload(this))
      .then(() => this.fadeIn(this._body))
  }

  /*
   * Translates the page using the specified translator.
   */
  translatePage() {
    return this._translator.translatePage();
  }

  /*
   * Fades element in.
   */
  fadeIn(element) {
    element.classList.remove(`fade-out`);
    element.classList.add(`fade-in`);
  }

  /*
   * Fades element out.
   */
  fadeOut(element) {
    element.classList.remove(`fade-in`);
    element.classList.add(`fade-out`);
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

  /*
   * Draws document footer.
   */
  _drawFooter() {
    return fetch(`/templates/footer.html`)
      .then((res) => res.text())
      .then((resText) => {
        var newFooter = document.createElement('footer');
        newFooter.innerHTML = resText;
        this._body.appendChild(newFooter);
      })
  }

  /*
   * Draws document navigation.
   */
  _drawNav(jsonMenu) {
    var htmlNav = ``;
    return fetch(`/templates/site-title-div.html`)
      .then((res) => res.text())
      .then((resText) => {
        htmlNav = resText;
      })

      .then(() => {
        htmlNav += `<ul>`;
        var previousParent = `/`;
        var ulOpen = false;

        for(var i = 0; i < jsonMenu.length; i++) {
          var jsonMenuItem = jsonMenu[i];

          var regexp = /http:\/\/cypher-f\.com((\/[a-z\-]*)?(\/[a-z\-]+)?)/g;
          var match = regexp.exec(this._url);
          var currentPageFullUrl  = match[0]; // Full URL
          var currentPageFullHref = match[1]; // URL relative to root (used for href)
          var currentPageParent   = match[2]; // Subdomain
          var currentPageLevel2   = match[3]; // Sub-subdomain

          var openingUl = ``;
          var closingUl = ``;
          var jsonParent = jsonMenuItem[`parent`];

          if ((jsonParent === `/`) || (jsonParent === currentPageParent)) {
            if (jsonParent != previousParent) {
              if (ulOpen) {
                htmlNav += `</ul>`;
                ulOpen = false;
              }
              if (jsonParent != `/`) {
                htmlNav += `<ul>`;
                ulOpen = true;
              }
            }

            var material_icon = jsonMenuItem[`material-icon`];
            var href = jsonMenuItem[`href`];
            var i18n = jsonMenuItem[`data-i18n`];
            var active = (currentPageFullHref === jsonMenuItem.href ? ` class="active"` : ``);
            htmlNav += `<li${active}><i class="material-icons">${material_icon}</i><a href="${href}" data-i18n="${i18n}"></a></li>`;
            previousParent = jsonParent;
          }
        }

        if (ulOpen) {
          htmlNav += `</ul>`;
        }
        htmlNav += `</ul>`;

        var newNav = document.createElement('nav');
        newNav.innerHTML = htmlNav;
        document.body.insertBefore(newNav, this._main);
      })
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