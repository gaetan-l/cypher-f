`use strict`

/**
 * Utility class for page operations.
 */
export default class PageUtil {
  /**
   * Fades element in.
   *
   * First removes fade-out class then adds fade-in class.
   * Transition effects to be defined in css.
   *
   * @param  HTMLElement  elemOrSel  the HTMLElement to
   *          or                     fade in or the selec-
   *         string                  tor used to access it
   */
  static fadeIn(elemOrSel) {
    var uniqueElement = PageUtil.getUniqueElement(elemOrSel);
    if (uniqueElement) {
      uniqueElement.classList.remove(`fade-out`);
      uniqueElement.classList.add(`fade-in`);
    }
  }

  /**
   * Fades element out.
   *
   * First removes fade-in class then adds fade-out class.
   * Transition effects to be defined in css.
   *
   * @param  HTMLElement  elemOrSel  the HTMLElement to
   *          or                     fade out or the selec-
   *         string                  tor used to access it
   */
  static fadeOut(elemOrSel) {
    var uniqueElement = PageUtil.getUniqueElement(elemOrSel);
    if (uniqueElement) {
      uniqueElement.classList.remove(`fade-in`);
      uniqueElement.classList.add(`fade-out`);
    }
  }

  /**
   * Returns a unique HTMLElement.
   *
   * If selector is already an HTMLElement, returns it as
   * is, otherwise if it is a string, uses it to query all
   * elements matching this selector. If it is unique, re-
   * turns it, otherwise, if there is 0 or more than 1 ele-
   * ment, or if selector is another type, returns null.
   *
   * @param   HTMLElement  elemOrSel  the HTMLElement to
   *           or                     access or the selec-
   *          string                  tor used to access it
   * @return  HTMLElement             the unique
   *                                  HTMLElement, or null
   */
  static getUniqueElement(elemOrSel) {
    if (typeof elemOrSel === 'HTMLElement' || elemOrSel instanceof HTMLElement) {
      return elemOrSel;
    }
    else if (typeof elemOrSel === 'string' || elemOrSel instanceof String) {
      var elements = document.querySelectorAll(elemOrSel);
      if (!(elements.length == 1)) {
        console.warn(`Tried to use PageUtil.getUniqueElement(elemOrSel) with selector "${elemOrSel}", found ${elements.length} element(s), should be 1.`);
        return null;
      }
      else {
        return elements[0];
      }
    }
    else {
      return null;
    }
  }
}