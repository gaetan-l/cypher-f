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
   * /!\ TODO: escape "#"" in url because otherwise, it
   * returns the directory listing!
   *
   * @param   string           filePath  the path used to
   *                                     access the file
   * @return  Promise(string)            a Promise contain-
   *                                     ing the content of
   *                                     the file in string
   */
  static async getFileText(filePath) {
    var text = null;
    var response = await fetch(filePath);
    return response.ok ? await response.text() : null;
  }
}