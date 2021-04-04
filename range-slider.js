"use strict";

// When the window loads, the document will be parsed to see if
// there are any 'mpRangeSlider' elements. If so, new range
// sliders will be created and inserted into those elements.
// A reference to each mpRangeSlider object will be stored in a global
// const for possible use by the user in other scripts.
const mpRangeSliders = {};

window.addEventListener("load", function() {
  const sliders = document.querySelectorAll("div[data-type='mpRangeSlider']");
  for(let i = 0; i < sliders.length; i++) {
    const options = {};
    let x = sliders[i];
    if(x.getAttribute("data-slider-id")) {
      options.sliderId = x.getAttribute("data-slider-id");
    }
    if(x.getAttribute("data-boundaries")) {
      try {
        options.boundaries = JSON.parse(x.getAttribute("data-boundaries"));
      } catch {
        try {
          // If there is a fractional value in the string that starts with a decimal
          // point then JSON.parse will throw an error. Try inserting a zero before
          // any decimal point that doesn't have a digit before it.
          let newString = x.getAttribute("data-boundaries").replace(/([^\d])(\.)/g, "$10$2");
          options.boundaries = JSON.parse(newString);
        } catch {
          // ignore
        }
        // ignore
      }
    }
    if(x.getAttribute("data-from")) {
      if(Number.isFinite(Number(x.getAttribute("data-from")))) {
        options.from = Number(x.getAttribute("data-from"));
      }
    }
    if(x.getAttribute("data-to")) {
      if(Number.isFinite(Number(x.getAttribute("data-to")))) {
        options.to = Number(x.getAttribute("data-to"));
      }
    }
    if(x.getAttribute("data-increments")) {
      try {
        options.increments = JSON.parse(x.getAttribute("data-increments"));
      } catch {
        // try to add zeros before any decimal points
        try {
          let newString = x.getAttribute("data-increments").replace(/([^\d])(\.)/g, "$10$2");
          options.increments = JSON.parse(newString);
        } catch {
          // ignore
        }
        // ignore
      }
    }
    if(x.getAttribute("data-collision")) {
      options.collision = x.getAttribute("data-collision");
    }
    if(x.getAttribute("data-label") || x.getAttribute("data-label") === "") {
      options.label = x.getAttribute("data-label")
    }
    if(x.getAttribute("data-label-range")) {
      try {
        options.labelRange = JSON.parse(x.getAttribute("data-label-range"));
      } catch {
        // ignore
      }
    }
    if(x.getAttribute("data-hide-values")) {
      try {
        options.hideValues = JSON.parse(x.getAttribute("data-hide-values"));
      } catch {
        // ignore
      }
    }
    if(x.getAttribute("data-update")) {
      options.update = x.getAttribute("data-update");
    }
    if(x.getAttribute("data-on-update")) {
      options.onUpdate = window[x.getAttribute("data-on-update")];
    }
    if(x.getAttribute("data-on-move")) {
      options.onMove = window[x.getAttribute("data-on-move")];
    }
    if(x.getAttribute("data-on-create")) {
      options.onCreate = window[x.getAttribute("data-on-create")];
    }
    if(x.getAttribute("data-sizing")) {
      options.sizing = x.getAttribute("data-sizing");
    }
    if(x.getAttribute("data-fixed-size")) {
      if(Number.isFinite(Number(x.getAttribute("data-fixed-size")))) {
        options.fixedSize = Number(x.getAttribute("data-fixed-size"));
      }
    }
    if(x.getAttribute("data-variable-min")) {
      if(Number.isFinite(Number(x.getAttribute("data-variable-min")))) {
        options.variableMin = Number(x.getAttribute("data-variable-min"));
      }
    }
    if(x.getAttribute("data-variable-max")) {
      if(Number.isFinite(Number(x.getAttribute("data-variable-max")))) {
        options.variableMax = Number(x.getAttribute("data-variable-max"));
      }
    }
    if(x.getAttribute("data-sizing-factor")) {
      if(Number.isFinite(Number(x.getAttribute("data-sizing-factor")))) {
        options.sizingFactor = Number(x.getAttribute("data-sizing-factor"));
      }
    }
    if(x.getAttribute("data-single")) {
      try {
        options.single = JSON.parse(x.getAttribute("data-single"));
      } catch {
        // ignore
      }
    }if(x.getAttribute("data-disabled")) {
      try {
        options.disabled = JSON.parse(x.getAttribute("data-disabled"));
      } catch {
        // ignore
      }
    }
    let hostElement = sliders[i];
    if(options.sliderId) {
     mpRangeSliders[options.sliderId] = newMpRangeSlider(hostElement, options);
    } else {
     let sym = Symbol("unnamed" + i);
     mpRangeSliders[sym] = newMpRangeSlider(hostElement, options);
    }
  }
  Object.freeze(mpRangeSliders);
});

// Public function used to create and return a mpRangeSlider object.
function newMpRangeSlider(parentElement, settings) {
  if(parentElement) {
    // variables for storing elements referenced by event functions
    let activeElement, inactiveElement
    let topBottom, mprsSlider;

    // used for properly positioning the sliding elements
    let touchOffset = 0;
    let btnOffset = 0;

    // settings with defaults assigned
    let sliderId= null;
    let dual = false;
    let boundaries = [0, 10, 0, 10];
    let from = 0;
    let to = 10;
    let incrementTop = 1;
    let incrementBottom = 1;
    let onUpdate = null; // callback to use after slider is finished moving
    let onMove= null; // callback to call with each move event
    let onCreate = null; // callback to call when slider is created
    let collision = "stop"; // push, stop, pass
    let label = "Slider";
    let labelRange = true;
    let update = "onStop"; // "onMove" will update values on each move event.
    let digitsTop = 0; // If boundaries or increments are fractional, we'll need to know what precision to maintain
    let digitsBottom = 0;
    let hideValues = false;
    let single = false;
    let disabled = false;

    // variables for storing calculations that can be done at time of creation
    let topSteps, bottomSteps, topStart, bottomStart, topEnd, bottomEnd, bottomRange, topRange;
    let topInverted, bottomInverted, fromInputId, toInputId, noLabel;
    let numberBuffer = "";
    let moving = false;

    // variables that control how the slider's sizing is controlled.
    let sizing = "variable" // ["fixed" | "variable"]
    let fixedSize = 18; // if sizing is fixed, this will be the average font-size
    let variableMin = 12; // smallest average font size
    let variableMax = 24; // largest average font size
    let sizingFactor = 1; // this affects the slope of the scaling function.

    let resizeObserver;
    if(window.ResizeObserver) {
      resizeObserver = new ResizeObserver(entries => {
        for(const entry of entries) {
          if(entry.contentBoxSize) {
            if(entry.contentBoxSize[0]) {
              sizeSlider(entry.contentBoxSize[0].inlineSize);
            } else {
              sizeSlider(entry.contentBoxSize.inlineSize);
            }
          } else {
            sizeSlider(entry.contentRect.width);
          }
        }
      });
    }

    // If sizing is set to "variable", the size of the various slider elements will
    // change based on the width of its parent element. This table insures that all
    // elements scale proportionately to each other.
    const sizeTable = [
      {
        selector: ".mprs-triangle.from",
        attributes: [
          {
            attribute: "borderTopWidth",
            property: "border-top-width",
            weight: 3.6
          },
          {
            attribute: "borderRightWidth",
            property: "border-right-width",
            weight: 1.8
          },
          {
            attribute: "borderLeftWidth",
            property: "border-left-width",
            weight: 1.8
          }
        ]
      },
      {
        selector: ".mprs-triangle.to",
        attributes: [
          {
            attribute: "borderRightWidth",
            property: "border-right-width",
            weight: 1.8
          },
          {
            attribute: "borderBottomWidth",
            property: "border-bottom-width",
            weight: 3.6
          },
          {
            attribute: "borderLeftWidth",
            property: "border-left-width",
            weight: 1.8
          }
        ]
      },
      {
        selector: ".mprs-triangle.from.single",
        attributes: [
          {
            attribute: "borderTopWidth",
            property: "border-top-width",
            weight: 5.4
          },
          {
            attribute: "borderLeftWidth",
            property: "border-left-width",
            weight: 1.2
          },
          {
            attribute: "borderRightWidth",
            property: "border-right-width",
            weight: 1.2
          }
        ]
      },
      {
        selector: ".mp-range-slider",
        attributes: [
          {
            attribute: "fontSize",
            property: "font-size",
            weight: 4
          }
        ]
      },
      {
        selector: ".mprs-label",
        attributes: [
          {
            attribute: "marginTop",
            property: "margin-top",
            weight: 0
          },
          {
            attribute: "marginRight",
            property: "margin-right",
            weight: 0
          },
          {
            attribute: "marginBottom",
            property: "margin-bottom",
            weight: 2
          },
          {
            attribute: "marginLeft",
            property: "margin-left",
            weight: 5
          }
        ]
      },
      {
        selector: ".mprs-current-value.from",
        attributes: [
          {
            attribute: "width",
            property: "width",
            weight: 8
          },
          {
            attribute: "height",
            property: "height",
            weight: 6
          },
          {
            attribute: "marginTop",
            property: "margin-top",
            weight: -1
          },
          {
            attribute: "marginRight",
            property: "margin-right",
            weight: 1
          },
          {
            attribute: "marginBottom",
            property: "margin-bottom",
            weight: 0
          },
          {
            attribute: "marginLeft",
            property: "margin-left",
            weight: 1
          }
        ]
      },
      {
        selector: ".mprs-current-value.from.single",
        attributes: [
          {
            attribute: "marginTop",
            property: "margin-top",
            weight: 2
          },
        ]
      },
      {
        selector: ".mprs-current-value.to",
        attributes: [
          {
            attribute: "width",
            property: "width",
            weight: 8
          },
          {
            attribute: "height",
            property: "height",
            weight: 6
          },
          {
            attribute: "marginTop",
            property: "margin-top",
            weight: 5
          },
          {
            attribute: "marginRight",
            property: "margin-right",
            weight: 1
          },
          {
            attribute: "marginBottom",
            property: "margin-bottom",
            weight: 0
          },
          {
            attribute: "marginLeft",
            property: "margin-left",
            weight: 1
          }
        ]
      },
      {
        selector: ".mprs-slider",
        attributes: [
          {
            attribute: "marginTop",
            property: "margin-top",
            weight: 6
          },
          {
            attribute: "marginRight",
            property: "margin-right",
            weight: 10
          },
          {
            attribute: "marginBottom",
            property: "margin-bottom",
            weight: 0
          },
          {
            attribute: "marginLeft",
            property: "margin-left",
            weight: 10
          }
        ]
      },
      {
        selector: ".mprs-track",
        attributes: [
          {
            attribute: "height",
            property: "height",
            weight: 2
          },
          {
            attribute: "borderBottomRightRadius",
            property: "border-bottom-right-radius",
            weight: 2
          },
          {
            attribute: "borderBottomLeftRadius",
            property: "border-bottom-left-radius",
            weight: 2
          },
          {
            attribute: "borderTopRightRadius",
            property: "border-top-right-radius",
            weight: 2
          },
          {
            attribute: "borderTopLeftRadius",
            property: "border-top-left-radius",
            weight: 2
          },
          {
            attribute: "marginTop",
            property: "margin-top",
            weight: 0
          },
          {
            attribute: "marginRight",
            property: "margin-right",
            weight: 3
          },
          {
            attribute: "marginBottom",
            property: "margin-bottom",
            weight: 6
          },
          {
            attribute: "marginLeft",
            property: "margin-left",
            weight: 3
          }
        ]
      },
      {
        selector: ".mprs-popup",
        attributes: [
          {
            attribute: "width",
            property: "width",
            weight: 10
          },
          {
            attribute: "height",
            property: "height",
            weight: 10
          },
          {
            attribute: "lineHeight",
            property: "line-height",
            weight: 10
          }
        ]
      },
      {
        selector: ".mprs-popup",
        attributes: [
          {
            attribute: "width",
            property: "width",
            weight: 10
          },
          {
            attribute: "height",
            property: "height",
            weight: 10
          },
          {
            attribute: "lineHeight",
            property: "line-height",
            weight: 10
          }
        ]
      },
      {
        selector: ".mprs-triangle-target.from",
        attributes: [
          {
            attribute: "top",
            property: "top",
            weight: -12
          },
          {
            attribute: "marginLeft",
            property: "margin-left",
            weight: -6
          },
          {
            attribute: "width",
            property: "width",
            weight: 12
          },
          {
            attribute: "height",
            property: "height",
            weight: 12
          }
        ]
      },
      {
        selector: ".mprs-triangle-target.from.single",
        attributes: [
          {
            attribute: "top",
            property: "top",
            weight: -8.6
          }
        ]
      },
      {
        selector: ".mprs-triangle-target.to",
        attributes: [
          {
            attribute: "top",
            property: "top",
            weight: 2
          },
          {
            attribute: "marginLeft",
            property: "margin-left",
            weight: -6
          },
          {
            attribute: "width",
            property: "width",
            weight: 12
          },
          {
            attribute: "height",
            property: "height",
            weight: 12
          }
        ]
      }
    ];

    // Initialize settings based on parameters received when a slider is to be created.
    function initSettings(settingsObj) {
      // Settings are optional, if none are provided, we will use defaults in the else statement.
      if(typeof settingsObj === 'object') {
        if(typeof settingsObj.collision === "string") collision = settingsObj.collision;
        if((typeof settingsObj.increments  === "number") && settingsObj.increments !== 0) {
          incrementTop = incrementBottom = settingsObj.increments;
        } else if(typeof settingsObj.increments === "object" && Array.isArray(settingsObj.increments) && settingsObj.increments.length > 0) {
          if(typeof settingsObj.increments[0] === "number" && settingsObj.increments[0] !== 0) incrementTop = incrementBottom = settingsObj.increments[0];
          if(typeof settingsObj.increments[1] === "number" && settingsObj.increments[1] !== 0) incrementBottom = settingsObj.increments[1];
          // If two different increments are provided, top and bottom slider will function individually.
          if(incrementTop !== incrementBottom) {
            dual = true;
            collision = "pass";
          }
        }
        if(Array.isArray(settingsObj.boundaries)) {
          let a, b, c, d;
          [a, b, c, d] = settingsObj.boundaries;
          // Look at boundaries in sets of 2. If there isn't a complete set of 2 numbers, use existing (default) boundaries.
          // If first two elements of the array are not valid numbers, then all elements will be ignored. Providing
          // 3rd and 4th boundaries without the 1st and 2nd will have no effect and defaults will be used for all boundaries.
          if(typeof a === "number" && typeof b === "number") {
            boundaries[0] = boundaries[2] = a;
            boundaries[1] = boundaries[3] = b;
          } else {
            a = boundaries[0];
            b = boundaries[1];
          }
          if(typeof c === "number" && typeof d === "number") {
            boundaries[2] = c;
            boundaries[3] = d;
          } else {
            c = boundaries[2];
            d = boundaries[3];
          }
          // ensure that boundaries allow at least one increment and only include even incremental values
          boundaries = incrementalRanges(a, b, c, d);
          // digitsTop and digitsBottom are set in the create function by looking at each slider's
          // boundaries and increments and determining the max number of digits required after a decimal point.
          // If there is the potential of fractional amounts, rounding will be required and insignificant
          // digits will need to be truncated from numbers.
          if(digitsTop) {
            truncateDigits(boundaries[0], digitsTop);
            truncateDigits(boundaries[1], digitsTop);
          }
          if(digitsBottom) {
            truncateDigits(boundaries[2], digitsBottom);
            truncateDigits(boundaries[3], digitsBottom);
          }
          // If top and bottom boundaries differ, enable sliders to function independently or each other.
          if(!(boundaries[0] === boundaries[2] && boundaries[1] === boundaries[3])) {
            dual = true;
            collision = "pass";  // override the collision setting
          } else if(incrementTop === incrementBottom) {
            dual = false;
          }
        } else {
          // Increments could have changed so make sure default or existing boundaries
          // are still in even increments and aren't smaller than one increment.
          let a, b, c, d;
          [a, b, c, d] = boundaries;
          boundaries = incrementalRanges(a, b, c, d);
        }
        // Calculate and save ranges, steps within ranges, boundary values,
        // and invertedness, for convenience later.
        topStart = boundaries[0];
        topEnd = boundaries[1];
        bottomStart = boundaries[2];
        bottomEnd = boundaries[3];
        topRange = Math.abs(topEnd - topStart);
        bottomRange = Math.abs(bottomEnd - bottomStart);
        topSteps = topRange / incrementTop + 1;
        bottomSteps = bottomRange / incrementBottom + 1;
        topInverted = boundaries[1] - boundaries[0] < 0;
        bottomInverted = boundaries[3] - boundaries[2] < 0;

        // if new from and to values are provided, use them. Otherwise, use existing values.
        // Adjust from and to values to makes sure they fall within boundaries and are even increments.
        let f = typeof settingsObj.from === "number" ? settingsObj.from : topStart;
        let t = typeof settingsObj.to === "number" ? settingsObj.to : bottomEnd;
        // round from and to to closest even increment
        f = (Math.round((f - topStart) / incrementTop) * incrementTop) + topStart;
        t = (Math.round((t - bottomStart) / incrementBottom) * incrementBottom) + bottomStart;
        if(!isInRange(f, topStart, topEnd)) {
          if(!topInverted) {
            f = f < topStart ? topStart : topEnd;
          } else {
            f = f < topStart ? topEnd : topStart;
          }
        }
        if(!isInRange(t, bottomStart, bottomEnd)) {
          if(!bottomInverted) {
            t = t < bottomStart ? bottomStart : bottomEnd;
          } else {
            t = t < bottomStart ? bottomEnd : bottomStart;
          }
        }
        if(collision !== "pass") {
          // If collision is not set to "pass" then the top slider can't be to the right
          // of the bottom slider. If it is, then values need to be adjusted. The "from"
          // value represents the top slider and the "to" value represents the bottom.
          // If left boundary are greater than right boundary, ranges are considered to be
          // inverted. In order to determine if the bottom slider is to the right of the top
          // slider, we need to take inversion into account.
          if((topInverted && f < t) || (!topInverted && t < f)) t = f;   // favor from value
        }
        // Save adjusted values.
        from = f;
        to = t;
        // Set callback for slider events using "bind" so that the callback functions will have
        // access to the slider properties and functions.
        if(typeof settingsObj.onUpdate === "function") onUpdate = settingsObj.onUpdate.bind(publicAPI);
        if(typeof settingsObj.onMove === "function") onMove = settingsObj.onMove.bind(publicAPI);
        if(typeof settingsObj.onCreate === "function") onCreate = settingsObj.onCreate.bind(publicAPI);
        // The "update" value determines when the displayed values on each end of the slider get updated.
        // "onStop" is the default so if string is not valid, set to "onStop";
        if(typeof settingsObj.update === "string") {
          update = settingsObj.update !== "onMove" ? "onStop" : "onMove";
        }
        // Set the title that appears on the top left of the slider.
        if(typeof settingsObj.label === "string") label = settingsObj.label;
        // Show a description of the slider range(s) and steps if true.
        if(typeof settingsObj.labelRange === "boolean") labelRange = settingsObj.labelRange;
        // Allow user to hide the values on each side of the slider
        if(typeof settingsObj.hideValues === "boolean") hideValues = settingsObj.hideValues;
        // If there is no label or range description, value elements will be out of alignment.
        // The sizeSlider function checks the noLabel variable to see if compensation is needed.
        noLabel = label === "" && !labelRange;
        // Create a slider with only the top triangle and the from value visible.
        if(typeof settingsObj.single === "boolean") single = settingsObj.single;
        if(single) {
          dual = false;
          collision = "pass";
          to = bottomStart;
        }
        if(typeof settingsObj.disabled === "boolean") disabled = settingsObj.disabled;
        // Let user set sizing parameters
        if(typeof settingsObj.sizing === "string") settingsObj.sizing === "fixed" ? sizing = "fixed" : sizing = "variable";
        if(typeof settingsObj.fixedSize === "number" && settingsObj.fixedSize > 0) fixedSize = settingsObj.fixedSize;
        if(typeof settingsObj.variableMin === "number" && settingsObj.variableMin > 0) variableMin = settingsObj.variableMin;
        if(typeof settingsObj.variableMax === "number" && settingsObj.variableMax > 0) variableMax = settingsObj.variableMax;
        if(typeof settingsObj.sizingFactor === "number" && settingsObj.sizingFactor > 0) {
          if(settingsObj.sizingFactor < .5) {
            sizingFactor = .5;
          } else if(settingsObj.sizingFactor > 2) {
            sizingFactor = 2;
          } else {
            sizingFactor = settingsObj.sizingFactor;
          }
        }
        // If an id setAttribute is provided, hidden inputs will be created and must be kept in sync.
        if(typeof settingsObj.sliderId === "string" && settingsObj.sliderId.length > 0) {
          sliderId = settingsObj.sliderId;
          setInputIds();
        }
      } else {
        // No settings were provided so use defaults
        topStart = boundaries[0];
        topEnd = boundaries[1];
        bottomStart = boundaries[2];
        bottomEnd = boundaries[3];
        topRange = Math.abs(topEnd - topStart);
        bottomRange = Math.abs(bottomEnd - bottomStart);
        topSteps = topRange / incrementTop + 1;
        bottomSteps = bottomRange / incrementBottom + 1;
        topInverted = boundaries[1] - boundaries[0] < 0;
        bottomInverted = boundaries[3] - boundaries[2] < 0;
        noLabel = label === "" && !labelRange;
      }
    }
    // Determine if a number is within the range of the boundaries.
    function isInRange(i, a, b) {
      if(a < b) return i >= a && i <= b;
      return i <= a && i >= b;
    }
    // Adjust boundaries so that ranges only allow even incremental values.
    // Boundaries ranges may be shortened, never lengthened.
    function incrementalRanges(a, b, c, d) {
      if(a <= b) {
        if((b - a) % incrementTop != 0) b = a + (Math.floor((b-a) / incrementTop) * incrementTop);
        if(b - a < incrementTop) b = a + incrementTop;
      } else {
        if((a - b) % incrementTop != 0) b = a - (Math.floor((a-b) / incrementTop) * incrementTop);
        if(a - b < incrementTop) a = b + incrementTop;
      }
      if(c <= d) {
        if((d - c) % incrementBottom != 0) d = c + (Math.floor((d-c) / incrementBottom) * incrementBottom);
        if(d - c < incrementBottom) d = c + incrementBottom;
      } else {
        if((c - d) % incrementBottom != 0) d = c - (Math.floor((c-d) / incrementBottom) * incrementBottom);
        if(c - d < incrementBottom) c = d + incrementBottom;
      }
      // When fractional increments are used, results of division will not be exact.
      // We need to truncate any digits that are beyond the required precision.
      digitsTop = Math.max(fractionalDigits(incrementTop), fractionalDigits(a), fractionalDigits(b));
      if(digitsTop) {
        a = truncateDigits(a, digitsTop);
        b = truncateDigits(b, digitsTop);
      }
      digitsBottom = Math.max(fractionalDigits(incrementBottom), fractionalDigits(c), fractionalDigits(d));
      if(digitsBottom) {
        c = truncateDigits(c, digitsBottom);
        d = truncateDigits(d, digitsBottom);
      }
      return [a, b, c, d];
    }
    // Create unique id's for hidden input elements and set variables.
    function setInputIds() {
      if(sliderId) {
        // Make sure the id will be unique
        fromInputId = sliderId + "a";
        while(document.getElementById(fromInputId)) {
          fromInputId = fromInputId + "a";
        }
        if(!single) {
          toInputId = sliderId + "b";
          while(document.getElementById(toInputId)) {
            toInputId = toInputId + "b";
          }
        }
      }
    }
    /**********************************/
    var publicAPI = {
      id: null,
      get,
      set,
      sizeSlider,
      disable
    };

    //return publicAPI;
    /**********************************/

    // Function that creates and inserts a slider into a document.
    function create(parentElement, settings) {
      if(!(parentElement && parentElement instanceof HTMLElement)) {
        parentElement = document.getElementsByTagName("body")[0];
      }
      initSettings(settings);
      mprsSlider = document.createElement("div");
      mprsSlider.classList.add("mp-range-slider");
      if(disabled) mprsSlider.classList.add("disabled");
      if(sliderId) mprsSlider.id = sliderId;
      const labelDiv = document.createElement("div");
      labelDiv.classList.add("mprs-label");
      //labelDiv.textContent = label;
      const title = document.createElement("span");
      title.classList.add("mprs-title");
      title.textContent = label;
      labelDiv.appendChild(title);
      const labelRangeSpan = document.createElement("span");
      labelRangeSpan.classList.add("mprs-range");
      if(!labelRange) labelRangeSpan.classList.add("hidden");
      labelRangeSpan.textContent = createRangeDescription();
      labelDiv.appendChild(labelRangeSpan)
      mprsSlider.appendChild(labelDiv);
      if(fromInputId) {
        const fromInput = document.createElement("input");
        fromInput.setAttribute("type", "hidden");
        fromInput.setAttribute("id", fromInputId);
        fromInput.setAttribute("name", fromInputId);
        fromInput.value = from;
        mprsSlider.appendChild(fromInput);
      }
      if(toInputId) {
        const toInput = document.createElement("input");
        toInput.setAttribute("type", "hidden");
        toInput.setAttribute("id", toInputId);
        toInput.setAttribute("name", toInputId);
        toInput.value = to;
        mprsSlider.appendChild(toInput);
      }
      const fromValueDiv = document.createElement("div");
      fromValueDiv.classList.add("mprs-current-value", "from");
      if(single) fromValueDiv.classList.add("single");
      fromValueDiv.textContent = from;
      if(!disabled) fromValueDiv.setAttribute("tabindex", "0");
      fromValueDiv.style.fontSize = getAdjustedFontSize(topStart, topEnd) + "%";
      if(hideValues) {
        fromValueDiv.style.display = "none";
      } else {
        fromValueDiv.onfocus = activateTop;
        fromValueDiv.onblur = deactivate();
        fromValueDiv.onkeydown = processKeyPress();
      }
      mprsSlider.appendChild(fromValueDiv);

      const toValueDiv = document.createElement("div");
      toValueDiv.classList.add("mprs-current-value", "to");
      toValueDiv.textContent = to;
      if(!disabled) toValueDiv.setAttribute("tabindex", "0");
      toValueDiv.style.fontSize = getAdjustedFontSize(bottomStart, bottomEnd) + "%";
      if(hideValues || single) {
        toValueDiv.style.display = "none";
      } else {
        toValueDiv.onfocus = activateBottom;
        toValueDiv.onblur = deactivate();
        toValueDiv.onkeydown = processKeyPress();
      }
      mprsSlider.appendChild(toValueDiv);

      const sliderDiv = document.createElement("div");
      sliderDiv.classList.add("mprs-slider");
      const track = document.createElement("div");
      track.classList.add("mprs-track");
      if(single) track.onclick = clickTrack;

      const fromHandle = document.createElement("div");
      fromHandle.classList.add("mprs-triangle-target", "from");
      if(single) fromHandle.classList.add("single");
      fromHandle.onmousedown = btnMouseDown;
      fromHandle.ontouchstart = btnTouchStart;
      const fromHandleTriangle = document.createElement("div");
      fromHandleTriangle.classList.add("mprs-triangle", "from");
      if(single) fromHandleTriangle.classList.add("single");
      const fromPopup = document.createElement("div");
      fromPopup.classList.add("mprs-popup", "mprs-hidden");
      fromHandle.appendChild(fromPopup);
      fromHandle.appendChild(fromHandleTriangle)
      track.appendChild(fromHandle);
      const toHandle = document.createElement("div");
      toHandle.classList.add("mprs-triangle-target", "to");
      const toHandleTriangle = document.createElement("div");
      toHandleTriangle.classList.add("mprs-triangle", "to");
      const toPopup = document.createElement("div");
      toPopup.classList.add("mprs-popup", "mprs-hidden");
      toHandle.appendChild(toPopup);
      toHandle.appendChild(toHandleTriangle);
      track.appendChild(toHandle);
      if(!single) {
        toHandle.onmousedown = btnMouseDown;
        toHandle.ontouchstart = btnTouchStart;
      } else {
        toHandle.style.visibility = "hidden";
      }
      if(!dual) {
        const rangeBlock = document.createElement("div");
        rangeBlock.classList.add("mprs-range-block");
        track.appendChild(rangeBlock);
      }
      sliderDiv.appendChild(track);
      mprsSlider.appendChild(sliderDiv);

      parentElement.innerHTML = "";
      parentElement.appendChild(mprsSlider);

      setButtons();
      sizeSlider();
      // Set the id property of the publicAPI object to the current id and then freeze
      // publicAPI so that all of it's properties are immutable.
      publicAPI.id = sliderId;
      Object.freeze(publicAPI);
      if(sizing === "variable") {
        if(resizeObserver) {
          resizeObserver.observe(mprsSlider);
        } else {
          window.addEventListener('resize', sizeSlider);
        }
      }
      if(onCreate) onCreate();
      return publicAPI;
    }
    // Creates a textual description of the range(s);
    function createRangeDescription() {
      if((!dual || single) && incrementTop === 1) {
        return `(range: ${topStart} to ${topEnd})`;
      } else if((!dual || single) && incrementTop !== 1) {
        return `(range: ${topStart} to ${topEnd}(step ${incrementTop}))`;
      } else if((topStart === bottomStart && topEnd === bottomEnd)) {
        return `(range: ${topStart} to ${topEnd}(top step ${incrementTop}, bottom step ${incrementBottom}))`;
      } else if(incrementTop === incrementBottom && (incrementTop !== 1 || incrementBottom !== 1)) {
        return `(ranges: ${topStart} to ${topEnd}(top) ${bottomStart} to ${bottomEnd}(bottom) (step ${incrementTop}))`;
      } else if(incrementTop === incrementBottom){
        return `(ranges: ${topStart} to ${topEnd}(top) ${bottomStart} to ${bottomEnd}(bottom))`;
      } else {
        return `(ranges: ${topStart} to ${topEnd}(top) (step ${incrementTop}) ${bottomStart} to ${bottomEnd}(bottom) (step ${incrementBottom}))`;
      }
    }

    function getAdjustedFontSize(a, b) {
      let lenA = String(a).length;
      let lenB = String(b).length;
      let maxLen = lenA > lenB ? lenA : lenB;
      let startAdj = 10;
      if(maxLen > 8) {
        return 70;
      }
      if(maxLen > 4) {
        let factor = maxLen > 8 ? 4 : maxLen - 4;
        return 120 - (10 + factor * 10)
      } else {
        return 120;
      }
    }
    // Sets position of sliders along the range based on current values.
    function setButtons() {
      // Calculate percentage for button positions.
      const fromBtn = mprsSlider.querySelector(".mprs-triangle-target.from");
      const toBtn = mprsSlider.querySelector(".mprs-triangle-target.to");
      let fromPercentage = ((Math.abs(from - topStart) / topRange) * 100).toPrecision(4);
      let toPercentage = ((Math.abs(to - bottomStart) / bottomRange) * 100).toPrecision(4);
      fromBtn.style.left = fromPercentage + "%";
      toBtn.style.left = toPercentage + "%";
      // Set range block if top and bottom ranges and increments are the same.
      if(!dual){
        const rangeBlock = fromBtn.parentElement.querySelector(".mprs-range-block");
        let newMargin = toPercentage - fromPercentage > 0 ? fromPercentage : toPercentage;
        rangeBlock.style.marginLeft = newMargin + "%";
        rangeBlock.style.width = Math.abs(toPercentage - fromPercentage) + "%";
        if(toPercentage - fromPercentage < 0 && !single) {
          rangeBlock.classList.add("mprs-inverted-range");
        } else {
          rangeBlock.classList.remove("mprs-inverted-range");
        }
      }
    }
    // Start the dragging process.
    function btnMouseDown(e) {
      if(!disabled ) {
        moving = true;
        e.preventDefault();
        const popup = e.currentTarget.firstElementChild;
        const btnDimensions = e.currentTarget.getBoundingClientRect();
        const clickOffset = e.clientX - e.currentTarget.parentElement.getBoundingClientRect().left;
        btnOffset = btnDimensions.left - e.currentTarget.parentElement.getBoundingClientRect().left;
        touchOffset = (clickOffset - btnOffset) - ((btnDimensions.right - btnDimensions.left) / 2);
        //activeElement = e.currentTarget;
        numberBuffer = "";
        if(e.currentTarget.classList.contains("from")) {
          activateTop();
          mprsSlider.querySelector(".mprs-current-value.to").classList.remove("active");
        } else {
          activateBottom();
          mprsSlider.querySelector(".mprs-current-value.from").classList.remove("active");
        }
        let value = topBottom === "top" ? from : to;
        if(update !== "onMove") {
          popup.classList.remove("mprs-hidden");
          positionPopup(popup, value);
        }
        document.addEventListener('mouseup', moveEnd);
        document.addEventListener('mousemove', moveButton);
        if(single) mprsSlider.querySelector(".mprs-track").removeEventListener('click', clickTrack);
      }
    }

    function btnTouchStart(e) {
      if(!disabled) {
        e.preventDefault();
        const popup = e.currentTarget.firstElementChild;
        btnOffset = e.currentTarget.getBoundingClientRect().left - e.currentTarget.parentElement.getBoundingClientRect().left;
        touchOffset = e.touches[0].clientX - e.currentTarget.getBoundingClientRect().left;
        // save reference to the target element and determine whether its the top or bottom handle
        //activeElement = e.currentTarget;
        numberBuffer = "";
        if(e.currentTarget.classList.contains("from")) {
          activateTop();
          mprsSlider.querySelector(".mprs-current-value.to").classList.remove("active");
        } else {
          activateBottom();
          mprsSlider.querySelector(".mprs-current-value.from").classList.remove("active");
        }
        let value = topBottom === "top" ? from : to;
        if(update !== "onMove") {
          popup.classList.remove("mprs-hidden");
          positionPopup(popup, value);
        }
        document.addEventListener('touchend', moveEnd);
        document.addEventListener('touchmove', touchMove);
      }
    }
    // Reposition elements as they are dragged and update values.
    function moveButton(e) {
      const offset = activeElement.parentElement.getBoundingClientRect().left;
      const btnWidth = (activeElement.getBoundingClientRect().right - activeElement.getBoundingClientRect().left) - 2;
      const otherLeft = (inactiveElement.getBoundingClientRect().left - offset) + (btnWidth / 2);
      const rangeWidth = (activeElement.parentElement.getBoundingClientRect().right - offset) - 2;
      let newLeft = (e.clientX - offset) - touchOffset;
      if(newLeft < 0) newLeft = 0;
      if(newLeft > rangeWidth) newLeft = rangeWidth;
      if((topBottom === "top" && newLeft > otherLeft) || (topBottom === "bottom" && newLeft < otherLeft)) {
        if(collision === "stop") {
          newLeft = otherLeft;
        } else if(collision === "push"){
          inactiveElement.style.left = newLeft + "px";
        }
      }
      activeElement.style.left = newLeft + "px";

      let newValue = calculateBtnValue(activeElement);
      if(topBottom === "top") {
        from = newValue;
      } else {
        to = newValue;
      }
      if(collision === "push") {
        let otherValue = calculateBtnValue(inactiveElement);
        if(topBottom === "top") {
          to = otherValue;
        } else {
          from = otherValue;
        }
      }
      if(!dual) positionRangeBlock();
      if(update === "onMove") {
        updateValueBoxes();
      } else {
        positionPopup(activeElement.firstElementChild, newValue);
      }
      if(onMove) onMove();
    }

    function touchMove(e) {
      e.preventDefault();
      const offset = activeElement.parentElement.getBoundingClientRect().left;
      const btnWidth = (activeElement.getBoundingClientRect().right - activeElement.getBoundingClientRect().left) - 2;
      const otherLeft = (inactiveElement.getBoundingClientRect().left - offset) + (btnWidth / 2);
      const rangeWidth = (activeElement.parentElement.getBoundingClientRect().right - offset) - 2;
      let newLeft = (e.touches[0].clientX - offset);

      if(newLeft < 0) newLeft = 0;
      if(newLeft > rangeWidth) newLeft = rangeWidth;
      if((topBottom === "top" && newLeft > otherLeft) || (topBottom === "bottom" && newLeft < otherLeft)) {
        if(collision === "stop") {
          newLeft = otherLeft;
        } else if(collision === "push"){
          inactiveElement.style.left = newLeft + "px";
        }
      }
      activeElement.style.left = newLeft + "px";

      let newValue = calculateBtnValue(activeElement);
      if(topBottom === "top") {
        from = newValue;
      } else {
        to = newValue;
      }
      if(collision === "push") {
        let otherValue = calculateBtnValue(inactiveElement);
        if(topBottom === "top") {
          to = otherValue;
        } else {
          from = otherValue;
        }
      }
      if(!dual) positionRangeBlock();
      if(update === "onMove") {
        updateValueBoxes();
      } else {
        positionPopup(activeElement.firstElementChild, newValue);
      }
      if(onMove) onMove();
    }
    // Reposition slider when track is clicked.
    function clickTrack(e) {
      if(!disabled && !moving) {
        if(!activeElement) activeElement = mprsSlider.querySelector(".mprs-triangle-target.from");
        if(!inactiveElement) inactiveElement = mprsSlider.querySelector(".mprs-triangle-target.to")
        const btnDimensions = activeElement.getBoundingClientRect();
        const offset = e.currentTarget.getBoundingClientRect().left;
        const btnWidth = btnDimensions.width - 2;
        const rangeWidth = activeElement.parentElement.getBoundingClientRect().width;
        let newLeft = (e.clientX - offset);
        if(newLeft < 0) newLeft = 0;
        if(newLeft > rangeWidth) newLeft = rangeWidth;
        activeElement.style.left = newLeft + "px";
        let newValue = calculateBtnValue(activeElement);
        from = newValue;
        let percent = ((Math.abs(from - topStart) / topRange) * 100).toPrecision(4);
        activeElement.style.left = percent + "%";
        positionRangeBlock();
        const rangeBlock = activeElement.parentElement.querySelector(".mprs-range-block");
        rangeBlock.style.width = percent + "%";
        updateValueBoxes();
        if(onMove) onMove();
        if(onUpdate) onUpdate();
      } else {
        if(moving) moving = false;
      }
    }
    // Set focus on current value elements so that keypresses can be processed.
    function setFocus(handle) {
      let valueDiv;
      if(handle === "top") {
        valueDiv = mprsSlider.querySelector(".mprs-current-value.from");
        valueDiv.focus();
      } else if(handle === "bottom") {
        valueDiv = mprsSlider.querySelector(".mprs-current-value.to");
        valueDiv.focus();
      }
    }
    // Keep popup element positioned relative to the slider triangle.
    function positionPopup(popup, value) {
      let btnDimensions = activeElement.getBoundingClientRect();
      let popDimensions = popup.getBoundingClientRect();
      let parentDimensions = activeElement.parentElement.getBoundingClientRect();
      let otherBtnDim = inactiveElement.getBoundingClientRect();
      let vpWidth = (window.innerWidth || document.documentElement.clientWidth);
      let newLeft, newTop, newRange;

      let sliderDimensions = activeElement.parentElement.parentElement.parentElement.parentElement.getBoundingClientRect();

      if(topBottom === "top") {
        newLeft = popDimensions.width * 1.5;
        newTop = -(popDimensions.width * .5);
      } else {
        newLeft = popDimensions.width * -2;
        newTop = -((popDimensions.bottom - popDimensions.top) + btnDimensions.height / 2);
      }
      // keep popup button within the viewport
      if(topBottom === "top") {
        let vpPos = btnDimensions.left + newLeft + 5;
        if(vpPos + popDimensions.width > sliderDimensions.right) newLeft = newLeft - ((vpPos + popDimensions.width) - sliderDimensions.right);
      } else {
        let vpPos = (btnDimensions.left + newLeft)
        if(vpPos < sliderDimensions.left) newLeft = newLeft + (sliderDimensions.left - vpPos);
      }
      popup.style.top = newTop + "px";
      popup.style.left = newLeft + "px";
      popup.textContent = value;
    }
    // Keep the range bar (area between sliders) in sync as triangles are dragged.
    function positionRangeBlock(){
      let btnDimensions = activeElement.getBoundingClientRect();
      let parentDimensions = activeElement.parentElement.getBoundingClientRect();
      let otherBtnDim = inactiveElement.getBoundingClientRect();
      let newRange = Math.abs(otherBtnDim.left - btnDimensions.left);
      let newMargin;
      const rangeBlock = activeElement.parentElement.querySelector(".mprs-range-block");
      rangeBlock.style.width = newRange + "px";
      if(btnDimensions.left < otherBtnDim.left) {
        newMargin = (btnDimensions.left - parentDimensions.left) + (btnDimensions.width - 2) / 2;
        rangeBlock.style.marginLeft = newMargin + "px";
      } else {
        newMargin = (otherBtnDim.left - parentDimensions.left) + (btnDimensions.width - 2) / 2;
        rangeBlock.style.marginLeft = newMargin + "px";
      }
      if(!single && ((topBottom === "top" && btnDimensions.left - otherBtnDim.left > 0 ) || (topBottom === "bottom" && btnDimensions.left - otherBtnDim.left < 0))) {
        rangeBlock.classList.add("mprs-inverted-range");
      } else {
        rangeBlock.classList.remove("mprs-inverted-range");
      }
    }
    // Calculate current from and to values based on position of the triangles.
    function calculateBtnValue (button) {
      let btnDimensions = button.getBoundingClientRect();
      let boxDimensions = button.parentElement.getBoundingClientRect();
      let btnWidth = Math.floor(btnDimensions.right - btnDimensions.left);
      let boxWidth = Math.floor(boxDimensions.right - boxDimensions.left);
      let values;
      let digitCount = 0;
      if((topBottom === "bottom" && button == activeElement) || (topBottom === "top" && button == inactiveElement)) {
        values = bottomSteps;
      } else {
        values = topSteps;
      }
      let btnPos = button.getBoundingClientRect();
      let pct = ((btnPos.left + (btnWidth - 2) / 2) - boxDimensions.left) / (boxWidth - 2);
      let btnValue;
      if((topBottom === "bottom" && button == activeElement) || (topBottom === "top" && button == inactiveElement)) {
        if(bottomInverted) {
          btnValue = bottomStart - (Math.round((bottomRange * pct) / incrementBottom) * incrementBottom);
          if(digitsBottom) btnValue = truncateDigits(btnValue, digitsBottom);
          if(btnValue > bottomStart) btnValue = bottomStart;
          if(btnValue < bottomEnd) btnValue = bottomEnd;
        } else {
          btnValue = (Math.round((bottomRange * pct) / incrementBottom) * incrementBottom) + bottomStart;
          if(digitsBottom) btnValue = truncateDigits(btnValue, digitsBottom);
          if(btnValue < bottomStart) btnValue = bottomStart;
          if(btnValue > bottomEnd) btnValue = bottomEnd;
        }
      } else {
        if(topInverted) {
          btnValue =  topStart - (Math.round((topRange * pct) / incrementTop) * incrementTop);
          if(digitsTop) btnValue = truncateDigits(btnValue, digitsTop);
          if(btnValue > topStart) btnValue = topStart;
          if(btnValue < topEnd) btnValue = topEnd;
        } else {
          btnValue = (Math.round((topRange * pct) / incrementTop) * incrementTop) + topStart;
          if(digitsTop) btnValue = truncateDigits(btnValue, digitsTop);
          if(btnValue < topStart) btnValue = topStart;
          if(btnValue > topEnd) btnValue = topEnd;
        }
      }
      return btnValue;
    }
    // get the number of digits after the decimal point for fractional increments
    function fractionalDigits(num) {
      if(Math.floor(num) === num) return 0;
      return num.toString().split(".")[1].length || 0;
    }
    // remove any digits beyond the amount of precision required
    function truncateDigits(num, dig) {
      return Math.floor(num * Math.pow(10, dig)) / Math.pow(10, dig);
    }
    // Update the values displayed at each end of the slider. If a value
    // has changed and there is a hidden input that is being updated,
    // fire its 'change' event incase there are eventListeners listening
    // for that event.
    function updateValueBoxes() {
      mprsSlider.querySelector(".mprs-current-value.from").textContent = from;
      mprsSlider.querySelector(".mprs-current-value.to").textContent = to;
      if(fromInputId) {
        const fromInputEle = document.getElementById(fromInputId);
        if(fromInputEle.value != from) {
          fromInputEle.value = from;
          let evt = new Event('change');
          fromInputEle.dispatchEvent(evt);
        }
      }
      if(toInputId){
        const toInputEle = document.getElementById(toInputId);
        if(toInputEle.value != to) {
          toInputEle.value = to;
          let evt = new Event('change');
          toInputEle.dispatchEvent(evt);
        }
      }
    }
    // While slider elements are being dragged, their positions are being
    // set using pixel values.
    // After a slider has stopped moving (mouseup or touchend events),
    // the slider elements' positions need to be converted to percentages
    // so that they will scale properly if screen size changes. This
    // will have a 'snap to' effect because sliders may move slightly.
    // Also, fire slider's onUpdate event and update the current value
    // elements if update is set to 'onStop'.
    function moveEnd(e) {
      const popup = activeElement.firstElementChild;
      const offset = activeElement.parentElement.getBoundingClientRect().left;
      const rangeWidth = (activeElement.parentElement.getBoundingClientRect().right - offset)
      const activeLeft = activeElement.getBoundingClientRect().left - offset;
      const inactiveLeft = inactiveElement.getBoundingClientRect().left - offset;
      popup.style.left = 0;
      popup.style.top = 0;
      popup.classList.add("mprs-hidden");
      document.removeEventListener('mouseup', moveEnd);
      document.removeEventListener('mousemove', moveButton);
      document.removeEventListener('touchend', moveEnd);
      document.removeEventListener('touchmove', touchMove);
      numberBuffer = "";
      // change button positions to percentages so that they will scale properly
      let newValue, otherValue;
      if(topBottom === "top") {
        newValue = from;
        otherValue = to;
        setFocus("top");
      } else {
        newValue = to;
        otherValue = from;
        setFocus("bottom");
      }
      let activePercent, inactivePercent;
      if(topBottom === "top") {
        activePercent = ((Math.abs(newValue - topStart) / topRange) * 100).toPrecision(4);
        inactivePercent = ((Math.abs(otherValue - bottomStart) / bottomRange) * 100).toPrecision(4);
      } else {
        activePercent = ((Math.abs(newValue - bottomStart) / bottomRange) * 100).toPrecision(4);
        inactivePercent = ((Math.abs(otherValue - topStart) / topRange) * 100).toPrecision(4);
      }
      activeElement.style.left = activePercent + "%";
      inactiveElement.style.left = inactivePercent + "%";
      if(!dual) {
        const rangeBlock = activeElement.parentElement.querySelector(".mprs-range-block");
        rangeBlock.classList.remove("mprs-hidden");
        let newMargin = activePercent - inactivePercent < 0 ? activePercent : inactivePercent;
        rangeBlock.style.marginLeft = newMargin +"%";
        rangeBlock.style.width = Math.abs(activePercent - inactivePercent) + "%";
        if(!single && ((activePercent - inactivePercent > 0 && topBottom === "top") || (activePercent - inactivePercent < 0 && topBottom === "bottom"))) {
          rangeBlock.classList.add("mprs-inverted-range");
        } else {
          rangeBlock.classList.remove("mprs-inverted-range");
        }
      }
      if(update !== "onMove") updateValueBoxes();
      if(onUpdate) onUpdate();
      if(!single) moving = false;
    }
    // Slider values can be changed using keypresses when they have focus.
    function processKeyPress() {
      return function(e) {
        if(e.key === "ArrowLeft" || e.key === "ArrowRight") {
          if(topBottom === "top") {
            if(e.key === "ArrowRight") {
              if(!(collision === "stop" && from === to) && from !== topEnd) {
                from = !topInverted ? from + incrementTop : from - incrementTop;
                if(!topInverted && collision === "push") {
                  if(from > to) to = from;
                }
                if(topInverted && collision === "push") {
                  if(from < to) to = from;
                }
              }
            } else if(e.key === "ArrowLeft") {
              if(from !== topStart) {
                from = !topInverted ? from - incrementTop : from + incrementTop;
              }
            }
          } else {
            if(e.key === "ArrowRight") {
              if(to !== bottomEnd) {
                to = !bottomInverted ? to + incrementBottom : to - incrementBottom;
              }
            } else if(e.key === "ArrowLeft") {
              if(!(collision === "stop" && from === to) && to !== bottomStart) {
                to = !bottomInverted ? to - incrementBottom : to + incrementBottom;
                if(!bottomInverted && collision === "push") {
                  if(to < from) from = to;
                }
                if(bottomInverted && collision === "push") {
                  if(to > from) from = to;
                }
              }
            }
          }
          if(digitsTop) from = truncateDigits(from, digitsTop);
          if(digitsBottom) to = truncateDigits(to, digitsBottom);
          setButtons();
          updateValueBoxes();
          if(onMove) onMove();
          if(onUpdate) onUpdate();
          numberBuffer = "";
        } else if(!isNaN(e.key + "0")) {
          addNumber(e.key);
        } else if(e.key === "Escape" || e.key === "Backspace" || e.key === "Enter" || e.key === "Tab") {
          let shift = false;
          switch (e.key) {
            case "Backspace":
              e.preventDefault();
              backspace();
              break;
            case "Escape":
              updateValueBoxes();
              numberBuffer = "";
              break;
            case "Tab":
              if(e.getModifierState("Shift") && topBottom === "bottom"){
                shift = "top";
                e.preventDefault();
              } else if(!e.getModifierState("Shift") && topBottom === "top"){
                shift = "bottom";
                if(!single) e.preventDefault();
              }
            case "Enter":
              if(!isNaN(Number(numberBuffer)) && numberBuffer.length > 0) {
                let n = validNumber(Number(numberBuffer));
                if(collision !== "pass") {
                  if(collision === "stop") {
                    if(topBottom === "top") {
                      if(!topInverted) {
                        if(n > to) n = to;
                      } else {
                        if(n < to) n = to;
                      }
                    } else {
                      if(!bottomInverted) {
                        if(n < from) n = from;
                      } else {
                        if(n > from) n = from;
                      }
                    }
                  } else { // push
                    if(topBottom === "top") {
                      if(!topInverted) {
                        if(n > to) to = n;
                      } else {
                        if(n < to) to = n;
                      }
                    } else {
                      if(!bottomInverted) {
                        if(n < from) from = n;
                      } else {
                        if(n > from) from = n;
                      }
                    }
                  }
                }
                if(topBottom === "top") {
                  from = n;
                } else {
                  to = n;
                }
                setButtons();
                updateValueBoxes();
                if(onMove) onMove();
                if(onUpdate) onUpdate();
                numberBuffer = "";
                if(shift === "top") {
                  mprsSlider.querySelector(".mprs-current-value.from").focus();
                } else if(shift === "bottom"){
                  mprsSlider.querySelector(".mprs-current-value.to").focus();
                }
              } else {
                updateValueBoxes();
                numberBuffer = "";
                if(shift === "top") {
                  mprsSlider.querySelector(".mprs-current-value.from").focus();
                } else if(shift === "bottom"){
                  mprsSlider.querySelector(".mprs-current-value.to").focus();
                }
              }
              break;
            default:
              // ignore
          }
        }
      }
    }
    // Determine n is a valid value (within boundaries and even increment)
    // and, if not, adjust it to a valid value and return it.
    function validNumber(n) {
      if(topBottom === "top") {
        n = (Math.round((n - topStart) / incrementTop) * incrementTop) + topStart;
        if(!isInRange(n, topStart, topEnd)) {
          if(!topInverted) {
            n = n < topStart ? topStart : topEnd;
          } else {
            n = n < topStart ? topEnd : topStart;
          }
        }
      } else {
        n = (Math.round((n - bottomStart) / incrementBottom) * incrementBottom) + bottomStart;
        if(!isInRange(n, bottomStart, bottomEnd)) {
          if(!bottomInverted) {
            n = n  < bottomStart ? bottomStart : bottomEnd;
          } else {
            n = n < bottomStart ? bottomEnd : bottomStart;
          }
        }
      }
      return n;
    }
    // Used by the keypress processing to update the display.
    function addNumber(number) {
      let valueDiv;
      if(topBottom === "top") {
        valueDiv = mprsSlider.querySelector(".mprs-current-value.from");
        if(number === "-" && (numberBuffer.length > 0 || (topStart > 0 && topEnd > 0))) {
          blink(valueDiv);
          return;
        }
        if(number === "-") {
          numberBuffer = "-";
          valueDiv.textContent = numberBuffer;
          return;
        }
        if(number === "." && (incrementTop % 1 === 0 || ~numberBuffer.indexOf("."))) {
          blink(valueDiv);
          return;
        }
        if(number === "."  && numberBuffer.length === 0) {
          numberBuffer = ".";
          valueDiv.textContent = numberBuffer;
          return;
        }
        if(Number(numberBuffer + number) > 0) {
          if(Number(numberBuffer + number) > (topStart < topEnd ? topEnd : topStart)) {
            blink(valueDiv);
            return;
          }
        } else {
          if(Number(numberBuffer + number) < (topStart > topEnd ? topEnd : topStart)) {
            blink(valueDiv);
            return;
          }
        }
        numberBuffer = numberBuffer + number;
        valueDiv.textContent = numberBuffer;
      } else {
        valueDiv = mprsSlider.querySelector(".mprs-current-value.to");
        if(number === "-" && (numberBuffer.length > 0 || (bottomStart > 0 && bottomEnd > 0))) {
          blink(valueDiv);
          return;
        }
        if(number === "-") {
          numberBuffer = "-";
          valueDiv.textContent = numberBuffer;
          return;
        }
        if(number === "." && (incrementBottom % 1 === 0 || ~numberBuffer.indexOf("."))) {
          blink(valueDiv);
          return;
        }
        if(number === "."  && numberBuffer.length === 0) {
          numberBuffer = ".";
          valueDiv.textContent = numberBuffer;
          return;
        }
        if(Number(numberBuffer + number) > 0) {
          if(Number(numberBuffer + number) > (bottomStart < bottomEnd ? bottomEnd : bottomStart)) {
            blink(valueDiv);
            return;
          }
        } else {
          if(Number(numberBuffer + number) < (bottomStart > bottomEnd ? bottomEnd : bottomStart)) {
            blink(valueDiv);
            return;
          }
        }
        numberBuffer = numberBuffer + number;
        valueDiv.textContent = numberBuffer;
      }
    }
    // Used by the keypress processing to update the display.
    function backspace() {
      if(numberBuffer.length > 0) {
        let inputContent = topBottom === "top" ? mprsSlider.querySelector(".mprs-current-value.from") : mprsSlider.querySelector(".mprs-current-value.to");
        numberBuffer = numberBuffer.slice(0, -1);
        inputContent.textContent = numberBuffer.length > 0 ? numberBuffer : topBottom === "top" ? from : to;
      }
    }
    // Create visual clues to indicate when a slider is active.
    function activateTop() {
      topBottom = "top";
      activeElement = mprsSlider.querySelector(".mprs-triangle-target.from");
      inactiveElement = mprsSlider.querySelector(".mprs-triangle-target.to");
      mprsSlider.querySelector(".mprs-current-value.from").classList.add("active");
      activeElement.querySelector(".mprs-triangle").classList.add("active");
      inactiveElement.querySelector(".mprs-triangle").classList.remove("active");
    }
    function activateBottom() {
      topBottom = "bottom";
      activeElement = mprsSlider.querySelector(".mprs-triangle-target.to");
      inactiveElement = mprsSlider.querySelector(".mprs-triangle-target.from");
      mprsSlider.querySelector(".mprs-current-value.to").classList.add("active");
      activeElement.querySelector(".mprs-triangle").classList.add("active");
      inactiveElement.querySelector(".mprs-triangle").classList.remove("active");
    }
    function deactivate() {
      return function(e) {
        if(e.currentTarget.classList.contains("from")) {
          mprsSlider.querySelector(".mprs-triangle.from").classList.remove("active");
          mprsSlider.querySelector(".mprs-current-value.from").classList.remove("active");
        } else {
          mprsSlider.querySelector(".mprs-triangle.to").classList.remove("active");
          mprsSlider.querySelector(".mprs-current-value.to").classList.remove("active");
        }
      }
    }
    // Provide visual feedback when a keypress is being ignored.
    function blink(ele) {
      ele.textContent = "";
      setTimeout(function() {
        ele.textContent = numberBuffer;
      }, 250)
    }

    function get(args) {
      const allProps = {
        from: from,
        to: to,
        incrementTop: incrementTop,
        incrementBottom: incrementBottom,
        topStart: topStart,
        topEnd: topEnd,
        bottomStart: bottomStart,
        bottomEnd: bottomEnd,
        collision: collision,
        label: label,
        update: update
      };
      if(typeof args === "string") {
        return allProps[args];
      } else if(Array.isArray(args) && args.length > 0){
        const returnObj = {};
        args.forEach((item, i) => {
          returnObj[item] = allProps[item];
        });
        return returnObj;
      } else {
        return allProps;
      }
    }

    // Resize slider elements based on the size of containing element.
    // Variable sizing can only be done when the containing element is visible.
    // If it is not possible to get a slider's parent element's width at the
    // time that the slider is created, the slider's size will be set using
    // the fixedSize as a basis. This function is part of the publicAPI so it
    // can be called at the time the slider becomes visible in order to allow
    // it to be variable in size.
    function sizeSlider(w) {
      // get width of slider if possible
      let sliderWidth = w || mprsSlider.getBoundingClientRect().width;
      if(!sliderWidth && sizing !== "fixed") return false; // use CSS rules
      // Each element has a weight assigned in order to keep proper proportions.
      // By default, a weightFactor of 1 represents 1% of the width of the control's
      // main div element. The main element's font-size has a weight or 4. Using that
      // weight and the fixed, minimum, and maximum font sizes, which are in pixels,
      // we can calculate a weightFactor that will keep the font size within the
      // specified range. That weightFactor can then be applied to all other sized
      // elements. The "sizingFactor" influences the rate at which the sizes will
      // change as the width of the control changes (the slope of the curve);
      let weightFactor;
      if(sizing === "fixed" || !sliderWidth) {
        weightFactor = fixedSize / 4;
      } else if(sizingFactor !== 1){
        weightFactor = .01 * sliderWidth * sizingFactor;
      } else {
        weightFactor = .01 * sliderWidth;
      }
      if(weightFactor * 4 < variableMin) {
        weightFactor = variableMin / 4;
      }
      if(weightFactor * 4 > variableMax) {
        weightFactor = variableMax / 4;
      }
      if(sliderWidth && (weightFactor * 4) / sliderWidth > .13) {
        weightFactor = weightFactor * .7;
      }
      let target;
      // iterate through all elements and adjust sizes based on the slider width
      sizeTable.forEach((item, i) => {
        let compensateForNoLabel = false;
        if(item["selector"] === ".mp-range-slider") {
          target = [mprsSlider];
        } else {
          target = mprsSlider.querySelectorAll(item["selector"]);
        }
        // If there is no lable or range description above the slider, the value elements at each end
        // will be out of alignment. Changing the "weight" of their top margin will realign them.
        if(noLabel && (item["selector"] === ".mprs-current-value.to" || item["selector"] === ".mprs-current-value.from" || item["selector"] === ".mprs-current-value.from.single")) {
          compensateForNoLabel = true;
        }
        for(let x = 0; x < target.length; x++) {
          item["attributes"].forEach((item, i) => {
            let adjust = 0;
            if(compensateForNoLabel && item["attribute"] === "marginTop") adjust = -4;
            target[x].style[item["attribute"]] = ((item["weight"] + adjust) * weightFactor) + "px";
          });
        }
      });
    }

    function disable(bool) {
      if(bool === undefined || (typeof bool === "boolean" && bool) && !disabled) {
        // disable this slider control if it is not alread disabled
        disabled = true;
        mprsSlider.classList.add("disabled");
        mprsSlider.querySelector(".mprs-current-value.from").removeAttribute("tabindex");
        mprsSlider.querySelector(".mprs-current-value.to").removeAttribute("tabindex");
      } else if(typeof bool === "boolean" && !bool && disabled) {
        // enable control if it is currently disabled
        disabled = false;
        mprsSlider.classList.remove("disabled");
        mprsSlider.querySelector(".mprs-current-value.from").setAttribute("tabindex", "0");
        mprsSlider.querySelector(".mprs-current-value.to").setAttribute("tabindex", "0");
      }
    }

    function set(settings) {

      let newSettings = cleanSettings(settings);
      if(newSettings) {
        // make sure only allowed properties are in settings
        let newSettings = cleanSettings(settings);
        // if the dual flag changes as a result of initializing new settings,
        // a range block needs to be added to or removed from the track div.
        let prevDual = dual;
        initSettings(newSettings);
        if(dual !== prevDual) {
          const trackDiv = mprsSlider.querySelector(".mprs-track");
          if(dual) {
            const rangeBlockDiv = trackDiv.querySelector(".mprs-range-block");
            trackDiv.removeChild(rangeBlockDiv);
          } else {
            const rangeBlock = document.createElement("div");
            rangeBlock.classList.add("mprs-range-block");
            trackDiv.appendChild(rangeBlock);
          }
        }
        const labelRangeSpan = mprsSlider.querySelector("span.mprs-range");
        if(labelRangeSpan && labelRangeSpan.textContent !== createRangeDescription()) {
          labelRangeSpan.textContent = createRangeDescription();
        }
        if(newSettings.hasOwnProperty("labelRange")) {
          if(labelRange) {
            labelRangeSpan.classList.remove("hidden");
          } else {
            labelRangeSpan.classList.add("hidden");
          }
        }
        const sliderLabel = mprsSlider.querySelector(".mprs-title");
        if(sliderLabel.textContent !== label) {
          sliderLabel.textContent = label;
        }
        setButtons();
        updateValueBoxes();
      }
    }

    // Only some settings can be changed on an existing slider control.
    // This function removes any properties from the settings object that
    // cannot be changed on an existing slider control. If settings ends
    // up being an empty object or is wasn't an object to begin with,
    // this function will return null.
    function cleanSettings(settings) {
      // Make sure settings is an object and that it's not empty
      if(typeof settings === "object" && !isEmpty(settings)) {
        const aryAllowed = [
          "from",
          "to",
          "boundaries",
          "increments",
          "collision",
          "label",
          "update",
          "labelRange"
        ];
        for(var i in settings) {
          if(!~aryAllowed.indexOf(i)) delete settings[i];
        }
        if(!isEmpty(settings)) {
          return settings;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }

    function isEmpty(object) {
      for(var i in object) { return false; } return true;
    }

    return create(parentElement, settings);
  }
}
