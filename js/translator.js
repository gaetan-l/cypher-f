`use strict`

/**
 * Class used to reanslate content using a json dictionary.
 *
 * @link  https://codeburst.io/translating-your-website-in-pure-javascript-98b9fa4ce427
 */
export default class Translator {
  static AVAILABLE_LANG() {return [`en`, `fr`];}
  static DEFAULT_LANG() {return `en`;}

  constructor() {
    this._currLang = null;
    this._dictionary = null;

    /*
     * Setting the language using either the cookies if
     * available, or the navigator, or the default langu-
     * age if all else fails.
     */
    var computedLang = Translator.DEFAULT_LANG();
    var cookieLang = this.getCookieLang();
    if (cookieLang != null) {
      computedLang = cookieLang;
    }
    else {
      var navLang = this.getNavLang();
      if (navLang != null) {
        computedLang = navLang;
      }
    }

    this._setCurrLang(computedLang);
  }

  /**
   * Returns the current language used to display the website.
   *
   * @return  string  the current language
   */
  getCurrLang() {
    return this._currLang;
  }

  /*
   * Returns the language set in the cookie.
   **/
  getCookieLang() {
    var langRegex = new RegExp(`lang=([^;]+)`);
    var matches = langRegex.exec(document.cookie);
    var cookieLang = (matches != null) ? unescape(matches[1]) : null;
    return cookieLang;
  }

  /**
   * Returns the navigator language.
   */
  getNavLang() {
    var navLangs = navigator.languages ? navigator.languages[0] : navigator.language;
    var navLang  = navLangs.substr(0, 2);
    return navLang;
  }

  /**
   * Sets the current language used to display the website.
   *
   * @access private
   * @param   string  the language to set, must be one of
   *                  the available languages
   */
  _setCurrLang(lang) {
    if (Translator.AVAILABLE_LANG().includes(lang)) {
      this._currLang = lang;
      document.cookie = `lang=${this._currLang};path=/`;
      document.documentElement.lang = this._currLang;
    }
    else {
      console.error(`Tried to set definedLanguage to ${lang}, shound be one of ${Translator.AVAILABLE_LANG()}.`);
    }
  }

  /**
   * Returns the dictionary currently corresponding to the
   * language currently in use, or fetches it if null and
   * saves it for later use.
   *
   * @access  private
   * @return  string/json  the dictionary
   */
  async _asyncGetDictionary() {
    if (this._dictionary === null) {
      this._dictionary = await this._asyncGetDictionary(this.getCurrLang());
    }

    return this._dictionary;
  }

  /**
   * Returns the dictionary corresponding to the specified
   * language, or fetches it if null.
   *
   * @access  private
   * @param   string       lang  the langage of the dictio-
   *                             nary to fetch
   * @return  string/json        the dictionary
   */
  async _asyncGetDictionary(lang) {
    if (lang !== null) {
      var response = await fetch(`/json/lang-${this.getCurrLang()}.json`);
      return await response.json();
    }
    else {
      console.error(`Failed to fetch dictionary with lang "null", should be one of ${Translator.AVAILABLE_LANG()}.`);
      return null;
    }
  }

  /**
   * Returns a single translated word.
   *
   * @param  string   code  the code of the word to tran-
   *                        slate
   * @param  string   lang  the language in which to tran-
   *                        slate the word, if null, the
   *                        current language will be used
   * @return  string        the translated word
   */
  async asyncGetTranslatedWord(code, lang = null) {
    lang = lang === null ? this.getCurrLang() : lang;
    var dictionary = await this._asyncGetDictionary(lang);
    var keys = code.split(`.`);
    var text = keys.reduce((obj, i) => obj[i], dictionary);

    if (text === undefined) {
      var tmp = document.createElement(`div`);
      var span = document.createElement(`span`);
      span.classList.add(`translation-error`);
      span.innerHTML = code;
      tmp.appendChild(span);
      text = span.outerHTML;
      console.error(`Failed to translate code "${code}" with lang "${lang}".`);
    }

    return text === undefined ? code : text;
  }

  /**
   * Translates the page using the current language and
   * dictionary.
   */
  async asyncTranslatePage() {
    var elements = document.querySelectorAll(`[data-i18n]`);

    for (let i = 0 ; i < elements.length ; i++) {
      var element = elements[i];
      /*
       * The dataset read-only property of the
       * HTMLOrForeignElement interface provides read/write
       * access to all the custom data attributes (data-*)
       * set on the element.
       * @link https://developer.mozilla.org/en-US/docs/Web/API/HTMLOrForeignElement/dataset
       */
      var code = element.dataset.i18n;
      var translation = await this.asyncGetTranslatedWord(code);

      if (translation) {
        element.innerHTML = translation;
      }
    };
  }

  /**
   * Switches betwen the available languages and translates
   * the page.
   */
  async asyncSwitchLanguage() {
    var currLang = this.getCurrLang();
    var index = Translator.AVAILABLE_LANG().indexOf(currLang);
    if (index > -1) {
      var next = Translator.AVAILABLE_LANG()[(index + 1) % Translator.AVAILABLE_LANG().length];
    }
    else {
      console.error(`Failed to switch lang, current lang ${currLang} unknown, should be one of ${Translator.AVAILABLE_LANG()}.`)
    }

    this._setCurrLang(next);
    await this.asyncTranslatePage();
  }
}