/*
 * Courtesy of: https://codeburst.io/translating-your-website-in-pure-javascript-98b9fa4ce427
 */
`use strict`

class Translator {
  /*
   * Returns current language, if null defines it using
   * cookie if available, or navigator language if not
   * setting the cookie on the way.
   */
  getLanguage() {
    if (this._lang == null) {
      var navLangs = navigator.languages ? navigator.languages[0] : navigator.language;
      var navLang  = navLangs.substr(0, 2);

      var langRegex = new RegExp(`lang=([^;]+)`);
      var matches = langRegex.exec(document.cookie);
      var cookieLang = (matches != null) ? unescape(matches[1]) : null;
      this._lang = cookieLang == null ? navLang : cookieLang;
    }

    return this._lang; 
  }

  /*
   * Defines current language either with the one passed
   * as a parameter, or if null gets the cookie or
   * navigator language, then translates the page using
   * the relevant dictionary.
   */
  translatePage(lang = null) {
    this._elements = document.querySelectorAll(`[data-i18n]`);
    if (lang) {
      this._lang = lang;
    }

    return fetch(`/json/lang-${this.getLanguage()}.json`)
      .then((res) => res.json())
      .then((dictionary) => {
        this._translate(dictionary);
      })
      .then(document.cookie = `lang=${this._lang};path=/`)
      .then(document.documentElement.lang = this._lang);
  }

  /*
   * Switches betwen the available languages and translates
   * the page.
   */
  switchLanguage(translator) {
    var availableLangs = [`en`, `fr`];
    var index = availableLangs.indexOf(translator.getLanguage());
    var next = availableLangs[(index + 1) % availableLangs.length];
    translator.translatePage(next);
  }

  /*
   * Translates the page using a dictionary.
   */
  _translate(dictionary) {
    document.querySelectorAll(`[data-i18n]`).forEach((element) => {
      var keys = element.dataset.i18n.split(`.`);
      var text = keys.reduce((obj, i) => obj[i], dictionary);

      if (text) {
        element.innerHTML = text;
      }
      else {
        element.innerHTML = `key ${keys} not found for ${this.getLanguage()}!`
      }
    });
  }
}

export default Translator;