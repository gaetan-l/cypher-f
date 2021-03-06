import      TextUtil from "/js/text-util.js";
import * as Type     from "/js/type.js";

`use strict`

const TEMPLATE_PATH = `/templates`;

/**
 * Utility class for page operations.
 */
export default class PageUtil {
  /**
   * Fades element in.
   *
   * First removes faded-out-onload class then adds
   * faded-in class. Transition effects defined in css.
   *
   * @param  HTMLElement  elemOrSel      the HTMLElement to
   *          or                         fade in or the se-
   *         string                      lector used to
   *                                     access it
   * @param  boolean      ignoreWarning  indicates the user
   *                                     doesn't want to be
   *                                     alerted if the
   *                                     item is not found
   */
  static fadeIn(elemOrSel, ignoreWarning = false) {
    const uniqueElement = PageUtil.getUniqueElement(elemOrSel, ignoreWarning);
    if (uniqueElement) {
      uniqueElement.classList.remove(`faded-out-onload`);
      uniqueElement.classList.add(`faded-in`);

      const excludedIds = [`fullscreen`];
      const id = uniqueElement.getAttribute(`id`);
      if (uniqueElement.classList.contains(`height-trick`) && id && !excludedIds.includes(id)) {
        PageUtil.asyncWaitForIt(250);
        const height = uniqueElement.getBoundingClientRect().height;
        const cs = window.getComputedStyle(uniqueElement);
        const borderTop = parseInt(cs.borderTopWidth.replace(`px`, ``));
        const borderBottom = parseInt(cs.borderBottomWidth.replace(`px`, ``));
        uniqueElement.style.setProperty(`height`, `${height - borderTop - borderBottom}px`);
      }
    }
  }

  /**
   * Fades element out.
   *
   * Removes faded-in class. Transition effects to be de-
   * fined in css.
   *
   * @param  HTMLElement  elemOrSel      the HTMLElement to
   *          or                         fade out or the
   *         string                      selector used to
   *                                     access it
   * @param  boolean      ignoreWarning  indicates the user
   *                                     doesn't want to be
   *                                     alerted if the
   *                                     item is not found
   */
  static fadeOut(elemOrSel, ignoreWarning = false) {
    const uniqueElement = PageUtil.getUniqueElement(elemOrSel, ignoreWarning);
    if (uniqueElement) {
      uniqueElement.classList.remove(`faded-in`);

      if (uniqueElement.classList.contains(`height-trick`)) {
        uniqueElement.style.removeProperty(`height`);
      }
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
   * @param  HTMLElement  elemOrSel    the unique
   *          or                       HTMLElement or the
   *         string                    selector used to
   *                                   access it
   * @param  boolean      ignoreError  indicates the user
   *                                   doesn't want en ex-
   *                                   ception to be thrown
   *                                   in case the element
   *                                   is not found
   */
  static getUniqueElement(elemOrSel, ignoreError = false) {
    if (typeof elemOrSel === 'HTMLElement' || elemOrSel instanceof HTMLElement) {
      return elemOrSel;
    }
    else if (typeof elemOrSel === 'string' || elemOrSel instanceof String) {
      var elements = document.querySelectorAll(elemOrSel);
      if (!(elements.length == 1)) {
        const error = `Tried to find element with selector "${elemOrSel}", found ${elements.length} element(s), should be 1.`;
        if (ignoreError) {
          console.warn(error);
          return null;
        }
        else {
          throw error;
        }
      }
      else {
        return elements[0];
      }
    }
    else {
      throw `Tried to find element with selector ${elemOrSel}, should use HTMLElement or string.`;
    }
  }

  /**
   * Replaces a placeholder element with html.
   *
   * Replaces the specified element with the specified
   * html. The element can be directly passed as an
   * HTMLElement or as a string selector. Does nothing if
   * the specified tag is not found, or if there are multi-
   * ple elements returned with the selector. Does nothing
   * either if html is null.
   *
   * @param   HTMLElement  elemOrSel  the HTMLElement that
   *           or                     has to be replaced,
   *          string                  or the selector used
   *                                  to access it
   * @param   string       html       the replacement html
   */
  static replaceElementWithHtml(elemOrSel, html) {
    const oldElement = PageUtil.getUniqueElement(elemOrSel);
    if (oldElement) {
      if (document.body.contains(oldElement)) {
        if (html != null) {
          oldElement.outerHTML = html;
        }
      }
      else {
        console.warn(`Tried to replace element ${oldElement} not attached to document.body.`)
      }
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
    const oldElement = PageUtil.getUniqueElement(elemOrSel);
    if (oldElement) {
      templatePath = (templatePath === null) ? TEMPLATE_PATH : templatePath;

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
        const html = await TextUtil.getFileText(`${templatePath}/${templateName}.html`);

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
    templatePath = (templatePath === null) ? TEMPLATE_PATH : templatePath;
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
  static bindOnClick(elemOrSel, triggered) {
    const uniqueElement = PageUtil.getUniqueElement(elemOrSel);
    if (uniqueElement) {
      uniqueElement.onclick = triggered;
    }
  }

  // TODO: doc
  static bindOnRightClick(elemOrSel, triggered) {
    const uniqueElement = PageUtil.getUniqueElement(elemOrSel);
    if (uniqueElement) {
      uniqueElement.addEventListener('contextmenu', e => {
        e.preventDefault();
        triggered();
      });
    }
  }

  /**
   * Wait for a specified amount of time.
   *
   * @param  integer  timeInMs  number of ms to wait
   */
  static async asyncWaitForIt(timeInMs) {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    await delay(timeInMs);
  }
}

export class Menu extends Type.Enum {
  constructor(id, iconJsonName, i18nLabel, leftClick, rightClick) {
    super([id, iconJsonName, i18nLabel, leftClick, rightClick]);
    this._id           = id;
    this._iconJsonName = iconJsonName;
    this._i18nLabel    = i18nLabel;
    this._leftClick    = leftClick;
    this._rightClick   = rightClick;
  }

  get id()           {return this._id;}
  get iconJsonName() {return this._iconJsonName;}
  get i18nLabel()    {return this._i18nLabel;}
  get leftClick()    {return this._leftClick;}
  get rightClick()   {return this._rightClick;}

  static async asyncBuild(id) {
    const icons = await (await fetch(`/json/icons.json`)).json();
    const ul = document.createElement(`ul`);
    ul.setAttribute(`id`, id);
    ul.classList.add(`contextual`, `menu`, `menu-level`, `fadable`, `faded-out-onload`, `height-trick`);

    for (let i = 0 ; i < this.items.length ; i++) {
      const li = document.createElement(`li`);
      li.setAttribute(`id`, this.items[i].id);
      PageUtil.bindOnClick(li, this.items[i].leftClick);
      if (this.items[i].rightClick) {
        PageUtil.bindOnRightClick(li, this.items[i].rightClick);
      }

      const iconNotifContainer = document.createElement(`div`);
      iconNotifContainer.classList.add(`icon-notif-container`)

      const icon = document.createElement(`i`);
      icon.classList.add(`material-icons`, `icon`);
      icon.innerHTML = TextUtil.getJsonValue(this.items[i]._iconJsonName, icons);

      const label = document.createElement(`label`);
      label.setAttribute(`data-i18n`, this.items[i].i18nLabel);
      label.setAttribute(`for`, this.items[i].id);

      iconNotifContainer.appendChild(icon);
      li.appendChild(iconNotifContainer);
      li.appendChild(label);
      ul.appendChild(li);
    }

    return ul;
  }
}