`use strict`

export const DISPLAY_GALLERY = `GALLERY`;

/**
 * Utility class for collection operations.
 */
export default class CollUtil {
  static GALLERY() {return `gallery`;}
  static DETAILS() {return `deteils`;}
  static DISPLAY_MODE() {return [CollViewBuilder.GALLERY(), CollViewBuilder.DETAILS()];}

  static ASC() {return `ASC`;}
  static DESC() {return `DESC`;}
  static DISPLAY_ORDER() {return [CollViewBuilder.ASC(), CollViewBuilder.DESC()];}
  static GROUPED() {return true;}
  static NOT_GROUPED() {return false;}

  static DATE() {return `date`;}
}