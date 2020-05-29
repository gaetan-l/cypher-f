import Enum from "/js/enum.js";

`use strict`

/**
 * Represent an HTMLElement part of document head.
 *
 * Used to sort the items.
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

  static from(htmlElement) {
    var details;
    switch (htmlElement.tagName) {
      case `TITLE`:  details = null;                                              break;
      case `META`:   details = htmlElement.name === `` ? null : htmlElement.name; break;
      case `LINK`:   details = htmlElement.rel;                                   break;
      case `STYLE`:  details = null;                                              break;
      case `SCRIPT`: details = htmlElement.type === `` ? null : htmlElement.type; break;
    }

    let items = this.items;
    for (let i = 0 ; i < items.length ; i++) {
      if ((items[i].tagName === htmlElement.tagName) && (items[i].details === details)) {
        return items[i];
      }
    }
    throw `Tried to find HeadElement with ${htmlElement}, tagName=${htmlElement.tagName} and details=${details} but failed.`;
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