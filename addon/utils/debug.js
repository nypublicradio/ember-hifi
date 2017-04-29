export default class Debug {
  constructor(name) {
    this.name = name;
    this.color = this._createColor();
    this.padLength = 25;
    this.timerStore = [];
  }

  /**
  * Logs some content in a pretty fromat
  * @param  {string} content - Content to log
  */

  log(content) {
    if (window.console && window.console.log) {
      const colorString = `color: ${this.color}; font-weight: bold;`;
      const name = this.name.slice(0, this.padLength);
      const titleContent = Array(this.padLength + 3 - name.length).join(' ');
      if (this._isIE() || !!window.callPhantom) {
        // IE's console isn't so great. Make this plain.
        const title = `${name}${titleContent} | ${content}`;
        console.log(title); // eslint-disable-line no-console
      }
      else {
        const title = `%c${name}${titleContent} | `;
        console.log(title, colorString, content); // eslint-disable-line no-console
      }
    }
  }

  /**
  * Ends a console timer with a given name
  * @param  {string} name - Name of the timer
  */
  timeEnd(name) {
    const start = Date.now();
    let foundIndex;

    const runningTimer = this.timerStore.find((item, index) => {
      if (item.name === name) {
        foundIndex = index;
        return true;
      }
    });

    if (runningTimer) {
      this.timerStore.splice(foundIndex, 1);
      this.log(`${name} took ${start - runningTimer.start}ms`);
    }
  }

  /**
  * Start a console timer with a given name
  * @param  {string} name - Name of the timer
  */
  time(name) {
    this.timerStore.push({ start: Date.now(), name });
  }

  _createColor() {
    const h = this._random(1, 360);
    const s = this._random(60, 100);
    const l = this._random(0, 50);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  _random(min, max) {
    return min + Math.random() * (max - min);
  }

  _isIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
      // IE 11 => return version number
      var rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
      // Edge (IE 12+) => return version number
      return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
  }
}
