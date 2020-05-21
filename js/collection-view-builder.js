`use strict`

/**
 * Helper class to build views able to display collections
 * (list, gallery, etc.).
 */
export default class CollectionViewBuilder {
  constructor(name, galleryContainer, pageBuilder) {
    this._name = name;
    this._galleryContainer = galleryContainer;
    this._pageBuilder = pageBuilder;
    this._currentGallery = null;
    this._availableGroupings = [];
  }

  /*
   * Builds the current gallery in the specified HTML
   * container element, using the specified PageBuilder.
   */
  buildGallery(container, pageBuilder, grouping = null, order = `ASC`) {
    this._drawPictures(container, pageBuilder, grouping, order);
    this._drawZoomContainer(pageBuilder);
  }

  /*
   * Returns the JSON gallery, fetches it via the API
   * if not already loaded. 
   */
  _getCurrentGallery() {
    if (this._currentGallery === null) {
      var request = new XMLHttpRequest();
      request.open(`GET`, `/api/collection/get-collection.php?name=${this._name}`, false);
      request.send();

      // JSON response
      var response = JSON.parse(request.response);
      var gallery = response.content;
      var availableGroupings = response.extra.availableGroupings;

      this._currentGallery = gallery;
      this._availableGroupings = availableGroupings;
    }
    return this._currentGallery;
  }

  /*
   * Returns the file path of a picture using the name of
   * the gallery and the file name.
   */
  _getFilePath(picture) {
    return `/images/${this._name}/${picture.fileName}`;
  }

  /*
   * Draws the pictures in the specified HTML container
   * element.
   */
  _drawPictures(container, pageBuilder, grouping, order) {
    // Loads gallery for the first time if not already done
    this._getCurrentGallery();

    // Revert to default grouping and order if parameters are wrong
    if (!(this._availableGroupings.includes(grouping))) {
      grouping = null;
    }
    if (!([`ASC`, `DESC`].includes(order))) {
      order = `ASC`;
    }

    this._getCurrentGallery().sort(function (x, y) {
      var jsonX = JSON.parse(x);
      var jsonY = JSON.parse(y);

      // Grouping always sorted alphabetically no matter the order...
      if ((!(grouping === null)) && (!(grouping === 'date'))) {
        var groupX = jsonX[grouping];
        var groupY = jsonY[grouping];

        if (!(groupX === groupY)) {
          return groupX.localeCompare(groupY);
        }
      }

      // Then items sorted chronologically depending on the order
      var dateX = Date.parse(jsonX.date);
      var dateY = Date.parse(jsonY.date);
      return (order === `DESC` ? dateY - dateX : dateX - dateY);
    });

    for (let i = 0 ; i < this._getCurrentGallery().length ; i++) {
      // Building picture frame.
      var frame = document.createElement(`div`);
      frame.classList.add(`picture-frame`);

      // Binding onclick event to frame.
      var galleryBuilder = this;
      frame.onclick = function() {
        var clickedImage = this.getElementsByTagName(`img`)[0];
        var index = parseInt(clickedImage.getAttribute(`index`));
        galleryBuilder._displayPicture(index, galleryBuilder);

        var zoomContainer = document.getElementById(`zoom-container`);
        pageBuilder.fadeIn(zoomContainer);
      };

      // Building picture.
      var picture = JSON.parse(this._getCurrentGallery()[i]);
      var img = document.createElement(`img`);
      img.setAttribute(`index`, i);
      img.setAttribute(`date`, picture.readableDate);
      img.setAttribute(`location`, picture.location);
      img.setAttribute(`description`, picture.description);
      img.src = this._getFilePath(picture);

      // Adding picture to frame and frame to container.
      frame.appendChild(img);
      container.appendChild(frame);
    }
  }

  /*
   * Draws the container conaining the full size picture
   * once clicked on.
   */
  _drawZoomContainer(pageBuilder) {
    // Building zoom container, image, labels and buttons.
    var zoomContainer = document.createElement(`div`);
    zoomContainer.setAttribute(`id`, `zoom-container`);

    var prevButton = document.createElement(`i`);
    prevButton.setAttribute(`id`, `prev-button`);
    prevButton.classList.add(`material-icons`);
    prevButton.innerHTML = `navigate_before`;

    var zoomImg = document.createElement(`img`);
    zoomImg.setAttribute(`id`, `zoom-img`);

    var nextButton = document.createElement(`i`);
    nextButton.setAttribute(`id`, `next-button`);
    nextButton.classList.add(`material-icons`);
    nextButton.innerHTML = `navigate_next`;

    var closeButton = document.createElement(`i`);
    closeButton.setAttribute(`id`, `zoom-close`);
    closeButton.classList.add(`material-icons`);
    closeButton.innerHTML = `close`;

    var zoomInfos = document.createElement(`div`);
    zoomInfos.setAttribute(`id`, `zoom-infos`);

    // Binding onclick event to close button.
    closeButton.onclick = function() {
      pageBuilder.fadeOut(zoomContainer);
    };

    // Adding all elements to zoom container and zoom
    // container to general container.
    zoomContainer.appendChild(prevButton);
    zoomContainer.appendChild(zoomImg);
    zoomContainer.appendChild(nextButton);
    zoomContainer.appendChild(zoomInfos);
    zoomContainer.appendChild(closeButton);
    document.body.appendChild(zoomContainer);
  }

  /*
   * Displays the full size picture once clicked on, with
   * navigation buttons and picture information labels.
   */
  _displayPicture(index, galleryBuilder) {
    var currentGallery = galleryBuilder._getCurrentGallery();
    var picture = JSON.parse(currentGallery[index]);
    document.getElementById(`zoom-img`).src = galleryBuilder._getFilePath(picture);

    document.getElementById(`zoom-infos`).innerHTML = `` +
      ((picture.date        == ``) ? `` : `<p id="img-location">${picture.date}</p>`) +
      ((picture.location    == ``) ? `` : `<p id="img-description">${picture.location}</p>`) +
      ((picture.description == ``) ? `` : `<p id="img-description">${picture.description}</p>`);

    document.getElementById(`prev-button`).onclick = function() {
      var prevIndex = (index + currentGallery.length - 1) % currentGallery.length;
      galleryBuilder._displayPicture(prevIndex, galleryBuilder);
    }

    document.getElementById(`next-button`).onclick = function() {
      var nextIndex = (index + 1) % currentGallery.length;
      galleryBuilder._displayPicture(nextIndex, galleryBuilder);
    }
  }
}