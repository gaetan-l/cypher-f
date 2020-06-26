`use strict`

/**
 * Utility class for text operations.
 */
export default class TextUtil {
  /**
   * Formats url so that they all use the same pattern.
   *
   * For comparison purposes only. Does not check the vali-
   * dity of the url.
   *
   * @param   string  unformatted  the url to format
   * @return  string               the formatted url
   */
  static formatUrl(unformatted) {
    var formatted = unformatted;
    if ((formatted === ``) || (formatted[formatted.length -1] != `\/`)) {
      formatted += `\/`;
    }
    return formatted;
  }

  /**
   * Fetches file and returns its content.
   *
   * Returns null if file not found.
   *
   * @param   string           filePath  the path used to
   *                                     access the file
   * @return  Promise(string)            a Promise contain-
   *                                     ing the content of
   *                                     the file in string
   */
  static async getFileText(filePath) {
    var text = null;
    var escaped = encodeURI(filePath).replace("#", "%23");
    var response = await fetch(escaped);
    return response.ok ? await response.text() : null;
  }

  /**
   * Returns the value of a json entry with its code.
   * @link https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
   *
   * @param   string  code  the code of the entry to browse
   * @param   json    json  the json to browse
   * @return  text          the value of the entry
   */
  static getJsonValue(code, json) {
    var keys = code.split(`.`);
    return keys.reduce((obj, i) => obj[i], json);
  }

  /**
   * Transforms a string to a format suitable for looklup,
   * that is to say lowercase and without accent.
   *
   * @param   string  string  the string to format
   * @return  string          the formatted string
   */
  static flattenString(string) {
    return string.normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``).toLowerCase();
  }

  /**
   * Transforms CamelCaseString to dash-case-string.
   *
   * @param   string  string  the string to transform
   * @return  string          the dash case string
   */
  static toDashCase(string) {
    return string.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
  }

  /**
   * Returns a string reverted ("String" becomes "gnirtS").
   *
   * @param   String  normal  the normal string
   * @return  String          the reversed string
   */
  static reverse(string) {
    return string.split(``).reverse().join(``);
  }
}