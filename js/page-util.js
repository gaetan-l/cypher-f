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
   * @param  HTMLElement  selOrElem  the HTMLElement to
   *          or                     fade in or the selec-
   *         string                  tor used to access it
   */
  static fadeIn(selOrElem) {
    var uniqueElement = PageUtil.getUniqueElement(selOrElem);
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
   * @param  HTMLElement  selOrElem  the HTMLElement to
   *          or                     fade out or the selec-
   *         string                  tor used to access it
   */
  static fadeOut(selOrElem) {
    var uniqueElement = PageUtil.getUniqueElement(selOrElem);
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
   * @param  HTMLElement  selOrElem  the HTMLElement to
   *          or                     access or the selector
   *         string                  used to access it
   */
  static getUniqueElement(selOrElem) {
    if (typeof selOrElem === 'HTMLElement' || selOrElem instanceof HTMLElement) {
      return selOrElem;
    }
    else if (typeof selOrElem === 'string' || selOrElem instanceof String) {
      var elements = document.querySelectorAll(selOrElem);
      if (!(elements.length == 1)) {
        console.warn(`Tried to use PageUtil.getUniqueElement(selOrElem) with selector "${selOrElem}", found ${elements.length} element(s), should be 1.`);
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