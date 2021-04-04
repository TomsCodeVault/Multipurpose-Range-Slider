# Multipurpose-Range-Slider

This is a pure javascript dual or single range slider developed to work well in a wide variety of environments. Please note that I'm a bit of an amatuer when it comes
to project collaboration. I'm not very comfortable with git and may struggle for a while using it.

This project was conceived and developed to fill a need I had for a simple dual range slider control. I realize that there are other options available but I wanted to
work on my coding skills and try to create something to use on my small hobby projects. I welcome any feedback.

## How to use the slider control
Add the range-slider.js and range-slider.css to your webpage by inserting a script tag and link tag in the head section. Once you've done that you have two ways
to insert sliders into your pages.

1. HTML
  ```HTML
  <div data-type="mpRangeSlider" data-label="My First Slider" data-boundaries="[0, 20]"></div>
  ```
  There are a total of 20 *data* attributes that can be used to define the slider and its functionality. All are optional. They will all be listed below.
  
2. Javascript
  ```javascript
  const ele = document.getElementById("slider-container")
  const options = {
    label: "My First Slider",
    boundaries: [0, 20]
  };
  const sliderObj = newMpRangeSlider(ele, options);
  ```
  There are 20 properties that can be specified in the options object. All are optional. Each property has an associated *data* attribute that can be
  used inside a div element to create a slider without using javascript.
  
## Properties and Attributes

###  Slider and Input Id's
* **sliderId** *(type: string, attribute: data-slider-id, default: null)*: Unique string that serves three different purposes.
  1. The slider control will have an id="\<sliderId\>".
  2. Hidden inputs will be created and inserted into the slider and will have values
  that will be kept in sync with the slider's from and to values. This is so that the slider may be nested inside a form element.
  They will have id and name attributes that will use the sliderId string with an "a" or "b" appended. "a" for the input with the
  *from* value and "b" for the one with the *to* value. If no sliderId is provided, these inputs will not be created.
  3. When creating a
  slider using javascript, an object is returned and can be used to access the API for that slider later in your code. When a slider
  is created by the range-slider script in response to finding an html element contained in the document, no such object is returned.
  Instead, the object is created and appended to a global object named "mpRangeSliders". If you provide a sliderId, you'll be able
  to acceess that object by simply referencing "mpRangeSliders[\<sliderId\>]". If you omit the sliderId, you will not be able to
  reference the object directly but it will still exist and you may still be able to interact with it using callbacks as explain
  in the section below on "Interacting with the Multipurpose Range Slider".

### Ranges, Increments, and Values
* **boundaries** *(type: array, attribute: data-boundaries, default: [0, 10])*: A slider may have different ranges for its top and bottom sliders.
If the array only has two elements, they will be used as the boundaries for both the top and bottom sliders. If the array contains a third and
fourth element and those elements are different than the first and second elements then they will be used as the boundaries for the bottom slider.
* **increments** *(type: number or array, attribute: data-increments, default: 1)*: If a single number or an array with only one element is
provided, it will apply to both top and bottom. If an array with 2 numbers is provided the first will be the increment (step) used for the top
slider, the second will be used for the bottom slider. If top and bottom boundaries and/or increments differ, the slider control will automatically
set its *collision* property to "pass", regardless of what you have set it to. When set to pass, the *range bar* will not longer be visible.
* **from** *(type: number, attribute: data-from, default: starting boundary of the top slider)*: This is the initial value of the top slider (from value).
* **to** *(type: number, attribute: data-to default: starting boundary of the bottom slider)*: This is the initial value of the bottom slider (to value).

### Slider Behavior
* **collision** *(type: string ["stop" | "push" | "pass"], attribute: data-collision, default: "stop")*: This setting determines the behavior of the
slider when the top and bottom reach the same point. If set to "stop", the slider being moved will not be able to go any further than the position of
the other slider. if set to "push", the other slider will be moved along with the active slider. If set to "pass", the sliders will be able to pass each
other. If the top and bottom boundaries or the top and bottom increments are not the same, this setting will be overwritten to be "pass". When set to
"pass", if the top and bottom boundaries and increments are the same, the *range bar* will turn from blue to red when the top slider is to the right of
the bottom slider. If the boundaries or increments differ for the top and bottom sliders, the *range bar* will no longer be visible.
* **update** *(type: string ["onStop" | "onMove"], attribute: data-update, default: "onStop")*: This setting determines when the top and bottom slider
values are updated. If set to "onMove", the values displayed on the sides of the slider bar will be updated as the slider is moved. If set to "onStop",
those values will not be updated until the slider movement has stopped. To help determine the value of the slider as it is moved when set to "onStop",
a round element, offset slightly from the moving slider, will appear and display the slider's current position along the slider bar.
* **disabled** *(type: boolean, attribute: data-disabled, default: false)*: When set to true, the slider control will be "grayed out" and not respond
to mouse or touch events.

### Slider Appearance and Size
* **label** *(type: string, attribute: data-label, default: "Slider")*: The name displayed above the top left of the slider. If you don't want a label
to be displayed, you must provide an empty string("") for this setting option. If you don't provide anything for this option, the default "Slider" will
be displayed.
* **labelRange** *(type: boolean, attribute: data-label-range, default: true)*: A description of range boundaries is created automatically by the
range-slider script. This setting determines whether or not that description is displayed in parenthesis next to the label.
* **sizing** *(type: string ["variable" | "fixed"], attribute: data-sizing, default: "variable")*: Determines whether or not the size of the slider's
elements scale in relation to the parent element's width.
* **fixedSize** *(type: number, attribute: data-fixed-size, default: 18)*: Base font-size in pixels used when sizing is set to "fixed". All other
elements' sizes are set relative to the font-size. Please note that increasing the size of elements will often result in a shorter slider bar. This is
because the surrounding elements are larger so the margins of the slider bar have to be increase to accomodate them.
* **variableMin** *(type: number, attribute: data-variable-min, default: 12)*: Minimum base font-size in pixels used when sizing is set to "variable".
* **variableMax** *(type: number, attribute: data-variable-max, default: 24)*: Maximum base font-size in pixels used when sizing is set to "variable".
* **sizingFactor** *(type: number [between .5 and 2], attribute: data-sizing-factor, default: 1)*: Factor that influences the slope of the sizing curve.
The differences when using this setting can be very subtle. The lower the factor, the longer it will take for the elements to reach their maximum size
and vice versa.
* **hideValues** *(type: boolean, attribute: data-hide-values, default: false)*: If set to true, this will hide the from and to values that are normally
displayed on each side of the slider bar.
* **single** *(type: boolean, attribute: data-single, default: false)*: If set to true, there will only be one rectangular slider and only the from value
will be displayed, unless hideValues is set to true then no values will be displayed. Additionally, the slider bar	will respond to mouse click events so
the slider can be positioned by clicking on the slider bar.

### Slider Events
* **onCreate** *(type: function, attribute: data-on-create, default: null)*: Callback function to be called when slider is created.
* **onMove** *(type: function, attribute: data-on-move, default: null)*: Callback function to be called on each slider move event.
* **onStop** *(type: functon, attribute: data-on-stop, default: null)*: Callback function to be called when slider stops moving (mouseup or touchend events).
