import * as Type from "/js/type.js";

`use strict`
export const FAVORITES      = `favorites`;
export const PHOTOS         = `photos`;

export const COUNTRY        = `country`;
export const DATE           = `date`;
export const DESCRIPTION    = `description`;
export const EXTENSION      = `extension`;
export const FILE_NAME      = `fileName`
export const LOCATION       = `location`;
export const NAME           = `name`;
export const READABLE_DATE  = `readableDate`;
export const TAGS           = `tags`;
export const TYPE           = `type`;
export const YEAR           = `year`;

/**
 * Specifies the different attributes of a collection
 * item.
 */
export class Attribute extends Type.Enum {}
Attribute.COUNTRY       = new Attribute(COUNTRY);
Attribute.DATE          = new Attribute(DATE);
Attribute.DESCRIPTION   = new Attribute(DESCRIPTION);
Attribute.EXTENSION     = new Attribute(EXTENSION);
Attribute.FILE_NAME     = new Attribute(FILE_NAME);
Attribute.LOCATION      = new Attribute(LOCATION);
Attribute.NAME          = new Attribute(NAME);
Attribute.READABLE_DATE = new Attribute(READABLE_DATE);
Attribute.TAGS          = new Attribute(TAGS);
Attribute.TYPE          = new Attribute(TYPE);
Attribute.YEAR          = new Attribute(YEAR);
Attribute.lock();

/**
 * Specifies the different display modes of a collection.
 */
export class DisplayMode extends Type.Enum {}
DisplayMode.POLAROID_GALLERY = new DisplayMode(`polaroid-gallery`);
DisplayMode.STACKED_GALLERY = new DisplayMode(`stacked-gallery`);
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
Column.FAVORITES_READABLE_DATE = new Column(FAVORITES,  READABLE_DATE);
Column.FAVORITES_TYPE          = new Column(FAVORITES,  TYPE);
Column.FAVORITES_NAME          = new Column(FAVORITES,  NAME);
Column.FAVORITES_COUNTRY       = new Column(FAVORITES,  COUNTRY);
Column.FAVORITES_YEAR          = new Column(FAVORITES,  YEAR);
Column.FAVORITES_TAGS          = new Column(FAVORITES,  TAGS);
Column.FAVORITES_DESCRIPTION   = new Column(FAVORITES,  DESCRIPTION);
Column.PHOTOS_READABLE_DATE    = new Column(PHOTOS, READABLE_DATE);
Column.PHOTOS_COUNTRY          = new Column(PHOTOS, COUNTRY);
Column.PHOTOS_LOCATION         = new Column(PHOTOS, LOCATION);
Column.PHOTOS_TAGS             = new Column(PHOTOS, TAGS);
Column.PHOTOS_DESCRIPTION      = new Column(PHOTOS, DESCRIPTION);
Column.lock();

export class TagsMode extends Type.EnumPair {
  get canHaveTags()    {return  this.member2;}
  get cannotHaveTags() {return !this.member2;}
}
TagsMode.NONE        = new TagsMode(`none`,        false);
TagsMode.I18N        = new TagsMode(`i18n`,        true);
TagsMode.ERRORS_ONLY = new TagsMode(`errors-only`, true);