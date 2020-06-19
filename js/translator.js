import TextUtil from "/js/text-util.js";

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
    /*
     * Setting the language using either the cookies if
     * available, or the navigator, or the default langu-
     * age if all else fails.
     */
    let computedLang = Translator.DEFAULT_LANG();
    const cookieLang = this._getCookieLang();
    if (cookieLang != null) {
      computedLang = cookieLang;
    }
    else {
      const navLang = this._getNavLang();
      if (navLang != null) {
        computedLang = navLang;
      }
    }

    /*
     * Using setter to set lang cause there is treatment
     */
    this.lang = computedLang;
    this._dictionaries = [];
  }

  get lang() {return this._lang;}
  get dictionaries() {return this._dictionaries;}

  /**
   * Sets current Translator lang, also sets cookie lang.
   *
   * @param  string  lang the language code
   */
  set lang(lang) {
    if (Translator.AVAILABLE_LANG().includes(lang)) {
      this._lang = lang;
      document.cookie = `lang=${this._lang};path=/`;
      document.documentElement.lang = this._lang;
    }
    else {
      throw `Tried to set definedLanguage to ${lang}, shound be one of ${Translator.AVAILABLE_LANG()}.`;
    }    
  }

  /*
   * Returns the language set in the cookie.
   *
   * @access  private
   **/
  _getCookieLang() {
    const langRegex = new RegExp(`lang=([^;]+)`);
    const matches = langRegex.exec(document.cookie);
    const cookieLang = (matches != null) ? unescape(matches[1]) : null;
    return cookieLang;
  }

  /**
   * Returns the navigator language.
   *
   * @access  private
   */
  _getNavLang() {
    const navLangs = navigator.languages ? navigator.languages[0] : navigator.language;
    const navLang  = navLangs.substr(0, 2);
    return navLang;
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
      let dictionary = this.dictionaries[lang];
      if (!dictionary) {
        const response = await fetch(`/json/lang-${lang}.json`);
        dictionary = await response.json();
        this.dictionaries[lang] = dictionary;
      }
      return dictionary;
    }
    else {
      throw `Failed to fetch dictionary with lang "null", should be one of ${Translator.AVAILABLE_LANG()}.`;
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
    lang = lang === null ? this.lang : lang;
    const dictionary = await this._asyncGetDictionary(lang);

    let text;
    try {
      text = TextUtil.getJsonValue(code, dictionary);
    }
    catch(error) {
      text = undefined;
    }
    finally {
      if (text === undefined) {
        const tmp = document.createElement(`div`);
        const span = document.createElement(`span`);
        span.classList.add(`translation-error`);
        span.innerHTML = code;
        tmp.appendChild(span);
        text = span.outerHTML;
        console.warn(`Failed to translate code "${code}" with lang "${lang}".`);
      }

      return text === undefined ? code : text;
    }
  }

  /**
   * Translates the page using the current language and
   * dictionary.
   */
  async asyncTranslatePage() {
    const elements = document.querySelectorAll(`[data-i18n]`);

    for (let i = 0 ; i < elements.length ; i++) {
      const element = elements[i];
      /*
       * The dataset read-only property of the
       * HTMLOrForeignElement interface provides read/write
       * access to all the custom data attributes (data-*)
       * set on the element.
       * @link https://developer.mozilla.org/en-US/docs/Web/API/HTMLOrForeignElement/dataset
       */
      const code = element.dataset.i18n;
      const translation = await this.asyncGetTranslatedWord(code);

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
    const index = Translator.AVAILABLE_LANG().indexOf(this.lang);
    if (index > -1) {
      var next = Translator.AVAILABLE_LANG()[(index + 1) % Translator.AVAILABLE_LANG().length];
      this.lang = next;
      await this.asyncTranslatePage();
    }
    else {
      throw `Failed to switch lang, current lang ${this.lang} unknown, should be one of ${Translator.AVAILABLE_LANG()}.`;
    }
  }
}