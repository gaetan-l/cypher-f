`use strict`

/**
 * Class used to reanslate content using a json dictionary.
 *
 * @link  https://codeburst.io/translating-your-website-in-pure-javascript-98b9fa4ce427
 */
class Translator {
  /**
   * Returns current language, if null defines it using
   * cookie if available, or navigator language.
   */
  getLanguage() {
    if (typeof this._lang === "undefined") {
      var navLangs = navigator.languages ? navigator.languages[0] : navigator.language;
      var navLang  = navLangs.substr(0, 2);

      var langRegex = new RegExp(`lang=([^;]+)`);
      var matches = langRegex.exec(document.cookie);
      var cookieLang = (matches != null) ? unescape(matches[1]) : null;
      this._lang = cookieLang == null ? navLang : cookieLang;
    }

    return this._lang; 
  }

  /**
   * Translates the page using  the relevant dictionary.
   * Also sets the language cookie.
   *
   * @param  string  lang  the language in which to tran-
   *                       slate the page
   */
  async translatePage(lang = null) {
    /*
     * If a language is specified, we set it as the current
     * language. If null, it will be defined by the cookies
     * or navigator by this.getLanguage called below.
     */
    if (lang) {
      this._lang = lang;
    }

    var response = await fetch(`/json/lang-${this.getLanguage()}.json`);
    var dictionary = await response.json();
    this._translatePage(dictionary);

    document.cookie = `lang=${this._lang};path=/`;
    document.documentElement.lang = this._lang;
  }

  /**
   * Switches betwen the available languages and translates
   * the page.
   */
  switchLanguage() {
    var availableLangs = [`en`, `fr`];
    var index = availableLangs.indexOf(this.getLanguage());
    var next = availableLangs[(index + 1) % availableLangs.length];
    this.translatePage(next);
  }

  /**
   * Translates the page using a specified dictionary.
   *
   * @param  json  dictionary  the json dictionary used for
   *                           the translation
   */
  _translatePage(dictionary) {
    document.querySelectorAll(`[data-i18n]`).forEach((element) => {
      var keys = element.dataset.i18n.split(`.`);
      var text = keys.reduce((obj, i) => obj[i], dictionary);

      if (text) {
        element.innerHTML = text;
      }
      else {
        // TODO: css error class
        element.innerHTML = `key ${keys} not found for ${this.getLanguage()}!`
      }
    });
  }
}

export default Translator;