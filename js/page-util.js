import TextUtil from "/js/text-util.js";

`use strict`

/**
 * Utility class for page operations.
 */
export default class PageUtil {
  static TEMPLATE_PATH() {return `/templates`;}

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

  /**
   * Replaces a placeholder element with html
   *
   * Replaces the specified element with the specified
   * html. The element can be directly passed as an
   * HTMLElement or as a string selector. Does nothing if
   * the specified tag is not found, or if there are multi-
   * ple elements returned with the selector. Does nothing
   * either if html is null.
   *
   * @access  private
   * @param   HTMLElement  elemOrSel     the HTMLElement to
   *           or                        that has to be re-
   *          string                     replaced, or the
   *                                     selector used to
   *                                     access it
   * @param   string       html          the replacement
   *                                     html
   */
  static replaceElementWithHtml(elemOrSel, html) {
    var oldElement = PageUtil.getUniqueElement(elemOrSel);
    if (document.body.contains(oldElement)) {
      if (oldElement) {
        if (html != null) {
          oldElement.outerHTML = html;
        }
      }
    }
    else {
      console.warn(`PageUtil.replaceElementWithHtml(...) tried to replace element not attached to document.body!`)
    }
  }

  /**
   * Replaces a placeholder element with a template.
   *
   * Replaces the specified element with the content of the
   * specified template. If no template name is specified,
   * uses the selector passed as the template name, but
   * only if it is a string. Does nothing if the specified
   * element is not found, or if there are multiple elements
   * returned with the selector. Does nothing either if the
   * template is not found.
   *
   * @access  private
   * @param   HTMLElement  elemOrSel     the HTMLElement to
   *           or                        that has to be re-
   *          string                     replaced, or the
   *                                     selector used to
   *                                     access it
   * @param   string       html          the replacement
   *                                     html, if null, the
   *                                     selector will be
   *                                     used to look for a
   *                                     template instead
   * @param  string        templatePath  allows to specify
   *                                     a different temp-
   *                                     late path
   */
  static async replaceElementWithTemplate(elemOrSel, templateName = null, templatePath = null) {
    var oldElement = PageUtil.getUniqueElement(elemOrSel);
    if (oldElement) {
      /*
       * If a template path is specify we use it, otherwise
       * we use the default one.
       */
      templatePath = (templatePath === null) ? PageUtil.TEMPLATE_PATH() : templatePath;

      /*
       * If a template name is specified, we use it, other-
       * wise we use the selector name, but only if it is a
       * string.
       */
      if (templateName === null) {
        if (typeof elemOrSel === 'string' || elemOrSel instanceof String) {
          templateName = elemOrSel;
        }
      }

      if (templateName != null) {
        var html = await TextUtil.getFileText(`${templatePath}/${templateName}.html`);

        PageUtil.replaceElementWithHtml(elemOrSel, html);
      }
    }
  }

  /**
   * Returns the content of a template, or null if not
   * found.
   *
   * @param  string  templateName  the template name
   * @param  string  templatePath  the template path, if
   *                               null the default path
   *                               will be used
   */
  static async getTemplateText(templateName, templatePath = null) {
    templatePath = (templatePath === null) ? PageUtil.TEMPLATE_PATH() : templatePath;
    return await TextUtil.getFileText(`${templatePath}/${templateName}.html`);
  }
  
  /**
   * Binds a function to an element's onclick event.
   *
   * @selector  HTMLElement  elemOrSel  the HTMLElement to
   *             or                     which the function
   *            string                  will be bound to,
   *                                    or the selector
   *                                    used to access it
   * @event     function     triggered  the function to
   *                                    bind to the ele-
   *                                    ment's onclick
   *                                    event
   */
  static bindOnclick(elemOrSel, triggered) {
    var uniqueElement = PageUtil.getUniqueElement(elemOrSel);
    if (uniqueElement) {
      uniqueElement.onclick = triggered;
    }
  }
}