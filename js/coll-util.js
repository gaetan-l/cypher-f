import Enum from "/js/enum.js";

`use strict`

/**
 * Utility class for collection operations.
 */
export class DisplayMode extends Enum {}
DisplayMode.GALLERY = new DisplayMode(`gallery`);
DisplayMode.DETAILS = new DisplayMode(`details`);
DisplayMode.lock();

export class Direction extends Enum {}
Direction.ASC = new Direction(`ascending`);
Direction.DESC = new Direction(`descending`);
Direction.lock();

export class Grouping extends Enum {}
Grouping.NOT_GROUPED = new Grouping(`not-grouped`);
Grouping.GROUPED = new Grouping(`grouped`);
Grouping.lock();

export class Sorting extends Enum {
  constructor(direction, grouping) {
    super([direction, grouping]);
    this._direction = direction;
    this._grouping  = grouping;
  }

  get direction() {return this._direction;}
  get grouping()  {return this._grouping;}

  static from(direction, grouping) {
    let items = this.items;
    for (let i = 0 ; i < items.length ; i++) {
      if ((items[i].direction === direction) && (items[i].grouping === grouping)) {
        return items[i];
      }
    }
    throw `Tried to find Sorting with direction=${direction} and grouping=${grouping} but failed.`;
  }
}
Sorting.ASC_NOT_GROUPED  = new Sorting(Direction.ASC,  Grouping.NOT_GROUPED);
Sorting.ASC_GROUPED      = new Sorting(Direction.ASC,  Grouping.GROUPED);
Sorting.DESC_NOT_GROUPED = new Sorting(Direction.DESC, Grouping.NOT_GROUPED);
Sorting.DESC_GROUPED     = new Sorting(Direction.DESC, Grouping.GROUPED);
Sorting.lock();

export const DATE          = `date`;
export const READABLE_DATE = `readableDate`;
export const LOCATION      = `location`;
export const DESCRIPTION   = `description`;