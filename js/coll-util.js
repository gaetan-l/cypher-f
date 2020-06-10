import Enum from "/js/enum.js";

`use strict`

/**
 * Specifies the different display modes of a collection.
 */
export class DisplayMode extends Enum {}
DisplayMode.GALLERY = new DisplayMode(`gallery`);
DisplayMode.DETAILS = new DisplayMode(`details`);
DisplayMode.lock();

/**
 * Specifies the direction of the sorting of a collection.
 */
export class Direction extends Enum {}
Direction.ASC = new Direction(`ascending`);
Direction.DESC = new Direction(`descending`);
Direction.lock();

/**
 * Specifies if items of a collections have to be grouped by
 * the attribute that is used to sort them.
 */
export class Grouping extends Enum {}
Grouping.NOT_GROUPED = new Grouping(`not-grouped`);
Grouping.GROUPED = new Grouping(`grouped`);
Grouping.lock();

/**
 * Enumerates and orders the different possible sortings of
 * a collection.
 */
export class Sorting extends Enum {
  constructor(direction, grouping) {
    super([direction, grouping]);
    this._direction = direction;
    this._grouping  = grouping;
  }

  get direction() {return this._direction;}
  get grouping()  {return this._grouping;}

  /**
   * Returns the Sorting corresponding to the specified pa-
   * rameters.
   *
   * @param   Direction  direction  of the Sorting
   * @param   Grouping   grouping   of the Sorting
   * @return  Sorting               the Sorting correspon-
   *                                ding to these parame-
   *                                ters
   */  
  static from(direction, grouping) {
    const index = Sorting.items.map(item => [item.direction.value, item.grouping.value].toString()).indexOf([direction.value, grouping.value].toString());
    if (index > -1) {
      return Sorting.items[index];
    }
    else {
      throw `Tried to find Sorting with direction=${direction} and grouping=${grouping} but failed.`;
    }
  }
}
Sorting.ASC_NOT_GROUPED  = new Sorting(Direction.ASC,  Grouping.NOT_GROUPED);
Sorting.ASC_GROUPED      = new Sorting(Direction.ASC,  Grouping.GROUPED);
Sorting.DESC_NOT_GROUPED = new Sorting(Direction.DESC, Grouping.NOT_GROUPED);
Sorting.DESC_GROUPED     = new Sorting(Direction.DESC, Grouping.GROUPED);
Sorting.lock();

export class TransMode extends Enum {}
TransMode.NONE = new TransMode(`none`);
TransMode.CURRENT = new TransMode(`current`);
TransMode.ALL = new TransMode(`all`);
TransMode.lock();

export const COUNTRY       = `country`;
export const DATE          = `date`;
export const DESCRIPTION   = `description`;
export const EXTENSION     = `extension`;
export const LOCATION      = `location`;
export const READABLE_DATE = `readableDate`;
export const TAGS          = `tags`;