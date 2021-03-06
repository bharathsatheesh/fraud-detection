(function () {
  /* globals chrome */
  'use strict';

  const imageDownloader = {
    // Source: https://support.google.com/webmasters/answer/2598805?hl=en
    imageRegex: /(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:bmp|gif|jpeg|png|svg|webp))(?:\?([^#]*))?(?:#(.*))?/i,

    extractImagesFromTags() {
      return [].slice.apply(document.querySelectorAll('img, a, [style]')).map(imageDownloader.extractImageFromElement);
    },

    extractImagesFromStyles() {
      const imagesFromStyles = [];
      for (let i = 0; i < document.styleSheets.length; i++) {
        const styleSheet = document.styleSheets[i];
        // Prevents `Failed to read the 'cssRules' property from 'CSSStyleSheet': Cannot access rules` error. Also see:
        // https://github.com/vdsabev/image-downloader/issues/37
        // https://github.com/odoo/odoo/issues/22517
        if (styleSheet.hasOwnProperty('cssRules')) {
          const { cssRules } = styleSheet;
          for (let j = 0; j < cssRules.length; j++) {
            const style = cssRules[j].style;
            if (style && style.backgroundImage) {
              const url = imageDownloader.extractURLFromStyle(style.backgroundImage);
              if (imageDownloader.isImageURL(url)) {
                imagesFromStyles.push(url);
              }
            }
          }
        }
      }

      return imagesFromStyles;
    },

    extractImageFromElement(element) {
      if (element.tagName.toLowerCase() === 'img') {
        let src = element.src;
        const hashIndex = src.indexOf('#');
        if (hashIndex >= 0) {
          src = src.substr(0, hashIndex);
        }
        return src;
      }

      if (element.tagName.toLowerCase() === 'a') {
        const href = element.href;
        if (imageDownloader.isImageURL(href)) {
          imageDownloader.linkedImages[href] = '0';
          return href;
        }
      }

      const backgroundImage = window.getComputedStyle(element).backgroundImage;
      if (backgroundImage) {
        const parsedURL = imageDownloader.extractURLFromStyle(backgroundImage);
        if (imageDownloader.isImageURL(parsedURL)) {
          return parsedURL;
        }
      }

      return '';
    },

    extractURLFromStyle(url) {
      return url.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    },

    isImageURL(url) {
      return url.indexOf('data:image') === 0 || imageDownloader.imageRegex.test(url);
    },

    relativeUrlToAbsolute(url) {
      return url.indexOf('/') === 0 ? `${window.location.origin}${url}` : url;
    },

    removeDuplicateOrEmpty(images) {
      const hash = {};
      for (let i = 0; i < images.length; i++) {
        hash[images[i]] = 0;
      }

      const result = [];
      for (let key in hash) {
        if (key !== '') {
          result.push(key);
        }
      }

      return result;
    }
  };

  imageDownloader.linkedImages = {}; // TODO: Avoid mutating this object in `extractImageFromElement`
  imageDownloader.images = imageDownloader.removeDuplicateOrEmpty(
    [].concat(
      imageDownloader.extractImagesFromTags(),
      imageDownloader.extractImagesFromStyles()
    ).map(imageDownloader.relativeUrlToAbsolute)
  );
  console.log(imageDownloader.images);
  // var myStrText=JSON.stringify(imageDownloader.images);
  var json_array = [];
  for (var i in imageDownloader.images){
    var str_array = imageDownloader.images[i].split("/");
    json_array.push({
      "url": imageDownloader.images[i],
      "year": str_array[4],
      "month": str_array[5],
      "day": str_array[6],
      "section": str_array[7],
      "caption": str_array[8]
    });
  }
  var json_string = JSON.stringify(json_array);
  var d = Date();
  const date_str = d.toLocaleString();
  // saveText(date_str + ".txt", json_string);

  function saveText(filename, text) {
    var tempElem = document.createElement('a');
    tempElem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    tempElem.setAttribute('download', filename);
    tempElem.click();
  }

  chrome.runtime.sendMessage({
    // linkedImages: imageDownloader.linkedImages
    images: imageDownloader.images
  });

  imageDownloader.linkedImages = null;
  imageDownloader.images = null;
}());
