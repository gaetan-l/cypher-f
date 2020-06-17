import * as Type from "/js/type.js";

`use strict`

export const PHOTOS         = `photos`

export const COUNTRY        = `country`;
export const DATE           = `date`;
export const DESCRIPTION    = `description`;
export const EXTENSION      = `extension`;
export const FILE_NAME      = `fileName`
export const LOCATION       = `location`;
export const READABLE_DATE  = `readableDate`;
export const TAGS           = `tags`;

/**
 * Specifies the different display modes of a collection.
 */
export class DisplayMode extends Type.Enum {}
DisplayMode.GALLERY = new DisplayMode(`gallery`);
DisplayMode.DETAILS = new DisplayMode(`details`);
DisplayMode.lock();

/**
 * Specifies the direction of the sorting of a collection.
 */
export class Direction extends Type.Enum {}
Direction.ASC = new Direction(`ascending`);
Direction.DESC = new Direction(`descending`);
Direction.lock();

/**
 * Specifies if items of a collections have to be grouped by
 * the attribute that is used to sort them.
 */
export class Grouping extends Type.Enum {}
Grouping.NOT_GROUPED = new Grouping(`not-grouped`);
Grouping.GROUPED = new Grouping(`grouped`);
Grouping.lock();

/**
 * Enumerates and orders the different possible sortings of
 * a collection.
 */
export class Sorting extends Type.EnumPair {
  get direction() {return this.member1;}
  get grouping()  {return this.member2;}
}
Sorting.ASC_NOT_GROUPED  = new Sorting(Direction.ASC,  Grouping.NOT_GROUPED);
Sorting.ASC_GROUPED      = new Sorting(Direction.ASC,  Grouping.GROUPED);
Sorting.DESC_NOT_GROUPED = new Sorting(Direction.DESC, Grouping.NOT_GROUPED);
Sorting.DESC_GROUPED     = new Sorting(Direction.DESC, Grouping.GROUPED);
Sorting.lock();

export class TransMode extends Type.Enum {}
TransMode.NONE = new TransMode(`none`);
TransMode.CURRENT = new TransMode(`current`);
TransMode.ALL = new TransMode(`all`);
TransMode.lock();

export class Column extends Type.EnumPair {
  get collection() {return this.member1;}
  get attribute()  {return this.member2;}
}
Column.PHOTOS_READABLE_DATE = new Column(PHOTOS, READABLE_DATE);
Column.PHOTOS_COUNTRY       = new Column(PHOTOS, COUNTRY);
Column.PHOTOS_LOCATION      = new Column(PHOTOS, LOCATION);
Column.PHOTOS_DESCRIPTION   = new Column(PHOTOS, DESCRIPTION);
Column.PHOTOS_TAGS          = new Column(PHOTOS, TAGS);
Column.PHOTOS_FILE_NAME     = new Column(PHOTOS, FILE_NAME);
Column.lock();