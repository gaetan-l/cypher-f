import Enum from "/js/enum.js";

`use strict`

/**
 * Enumerates and orders the possible entry in a document
 * head.
 * @see PageBuilder._drawHead()
 */
export default class HeadElement extends Enum {
  constructor(tagName, details = null) {
    super([tagName, details]);
    this._tagName = tagName;
    this._details = details;
  }

  get tagName() {return this._tagName;}
  get details() {return this._details;}

  /**
   * Returns the HeadElement corresponding to the specified
   * HTMLElement.
   *
   * @param   HTMLElement  htmlElement  the HTMLElement to
   *                                    classify
   * @return  HeadElement               the corresponding
   *                                    HeadElement
   */
  static from(htmlElement) {
    let details;
    switch (htmlElement.tagName) {
      case `TITLE`:  details = null;                                              break;
      case `META`:   details = htmlElement.name === `` ? null : htmlElement.name; break;
      case `LINK`:   details = htmlElement.rel;                                   break;
      case `STYLE`:  details = null;                                              break;
      case `SCRIPT`: details = htmlElement.type === `` ? null : htmlElement.type; break;
    }

    const index = HeadElement.items.map(item => [item.tagName, item.details].toString()).indexOf([htmlElement.tagName, details].toString());
    if (index > -1) {
      return HeadElement.items[index];
    }
    else {
      throw `Tried to find HeadElement with ${htmlElement}, tagName=${htmlElement.tagName} and details=${details} but failed.`;
    }
  }
}
HeadElement.TITLE            = new HeadElement(`TITLE`);
HeadElement.META_DESCRIPTION = new HeadElement(`META`,   `description`);
HeadElement.META_AUTHOR      = new HeadElement(`META`,   `author`);
HeadElement.META_OTHER       = new HeadElement(`META`);
HeadElement.LINK_STYLESHEET  = new HeadElement(`LINK`,   `stylesheet`);
HeadElement.LINK_ICON        = new HeadElement(`LINK`,   `icon`);
HeadElement.STYLE            = new HeadElement(`STYLE`);
HeadElement.SCRIPT_MODULE    = new HeadElement(`SCRIPT`, `module`);
HeadElement.SCRIPT_OTHER     = new HeadElement(`SCRIPT`);
HeadElement.lock();