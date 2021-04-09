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
  Instead, an object is created and appended to a global object named "mpRangeSliders". If you provide a sliderId, you'll be able
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
* **update** *(type: string ["onStop" | "onMove"], attribute: data-update, default: "onStop")*: This setting determines when the top and bottom slider values are updated. If set to "onMove", the values displayed on each end of the slider bar will be updated as the slider is moved. If set to "onStop", those values will not be updated until the slider movement has stopped. To help indicate the value of the slider as it is moved when set to "onStop", a rectangular element will appear above the slider and display the slider's current position along the slider bar.
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

### Interacting with the Multipurpose Range Slider

There are several ways in which you can interact with a Multipurpose Range Slider. The slider can be manipulated through its user interface on a webpage. Users can move the sliders by clicking and dragging with a mouse or tapping and dragging with a finger or pointer on a touch enabled device. Moving the sliders will change the from and to values accordingly. If a device is equipped with a keyboard, the sliders will also respond to certain keypress events. Numbers, backspace, escape and enter keypresses are captured and processed. A slider control with single set to true will also respond to mouse clicks along its slider bar.

Another way to interact with your Multiplurpose Range Slider is to assign callbacks to certain events that a slider exposes. The callbacks must be functions in your script. When certain events occur during a slider control's lifetime, the slider will call the function that is assigned to that event, if there is one. The functions are bound to the slider so when they are called your function will have access to a "this" object that is the public API of the slider control that the event occurred in. This enables your function to determine which slider the event originated in, if you have more than one slider on your page, and to access and change that slider's properties. The public API is discussed below.

The events you can assign callbacks to are:
* **onCreate** - This event will only ever fire one time, when a slider is created. It may be useful in cases where you intend to use your slider to control other elements on your page. You can initialize the other element at the time the slider is created and then keep the other element in sync with the slider by using one or both of the other events.
* **onMove** - This event will fire every time the top or bottom slider is moved and a mousemove or touchmove event ocurrs. Any function you assign to this event should be as efficient as possible since it may get called many times in rapid succession.
* **onUpdate** - This event only fires when the top or bottom slider is finished moving and the values are updated. Please note that if the values are updated programatically through the use of the publicAPI, this callback will not be called. If you do that, you need to remember to handle that with your code.

In addition to interacting with the slider's user interface and providing callbacks, some slider properties and functions can also be accessed and manipulated programatically by using the API that is provided by the object returned when the slider is created. When you create a slider programitically, you can save the returned object using your own variable and use it to access the API. If you use a div element with data-type="mpRangeSlider" to create a slider, an mpRangeSlider object will be added to the global mpRangeSliders object. mpRangeSliders is simply a container for the objects that are returned when a slider is created. If you want to be able to interact with a slider's API directly, you should be sure to provide a data-slider-id attribute with a unique name in the div element that you use to create your slider in the first place. If you've done that, you will be able to access the slider's API simply by referring to mpRangeSliders["\<yourSliderId\>"]. If no data-slider-id attribute is provided, the object will still be included in the mpRangeSliders object but you will not be able to call it directly.

The API consists of one property and four functions listed below. One way to access the API is to use the "this" object inside one of your callback functions. That way, you can use one function as a callback for multiple sliders.
* **id**: a property that references the id of the slider control element. This property will be null if no sliderId was provided at the time the slider control was created. It may be helpful when you have more than one slider on your page and you're using the same callback function for multiple slider controls.
* **get**: *(get( null | string | array ))* a function that returns one or more properties. If no parameter is provided, an object with 11 key-value pairs will be returned. If a single string value is provided, the function will return a single value. If an array is provided, the function will return an object containing key-value pairs for each string value in the array, if the string value matches one of the property names listed below:
  * **from**: the from value
  * **to**: the to value
  * **incrementTop**: the increment (step) of the top slider
  * **incrementBottom**: the increment (step) of the bottom slider
  * **topStart**: the left boundary of the top slider
  * **topEnd**: the right boundary of the top slider
  * **bottomStart**: the left boundary of the bottom slider
  * **bottomEnd**: the right boundary of the bottom slider
  * **collision**: the string value of the collision setting
  * **label**: the text above the slider
  * **update**: the setting that controls when the values are updated
* **set**: *(set( {key: value, key: value, ...} ))* a function that requires an object containing key-value pairs. Many, but not all, of the slider's properties can be modified without recreating the slider. This is helpful if you want to change some aspect of a slider without losing any of its other settings. The function allows you to set the values for any or all of the following slider properties:
  * from
  * to
  * boundaries
  * increments
  * collision
  * label
  * labelRange
  * update

For example, to set the collision property to "push", you would call slider.set({collision: "push"}). (See the Properties and Attributes section above for the explanation of each setting and the correct type for the values.)

Take note that changing some of these properties may cause a slider to adjust some other values. For example, If you set new boundaries for the top slider and, as a result, the from value is now outside of the top boundaries, the from value will be adjusted to equal the closest boundary value. Another example of a change that might not be expcected is when the collision setting is changed from "pass" to "push" or "stop", and the top slider is to the right of the bottom slider before that change is made, then the bottom slider will be moved to the same position as the top slider and the to value will be adjusted accordingly.
* **sizeSlider**: *(sizeSlider( [width] ))* a function that will resize the slider control's elements based on the width parameter or the width of its parent element if no parameter is provided. When a slider control is created, the script will attempt to size it based on its parent container's width. If that container is not visible at the time of creation, then it will use a fixed set of css rules. Once it becomes visible the script will try to size it again. In some environments, it may not be possible to know when it becomes visible. Finally, if the window is resized, the slider control will be resized. If it wasn't sized properly before then, the change may create a noticeable or even undesireable shift in page elements. To avoid this, if you know the width of the containing element and you know that it won't be visible at the time that the slider is created, you can use this function to size the slider before it does become visible. If you don't know the size of its containing element, but your code is responsible for making it visible, then you can use this function to size the slider at the time you make it visible. If you call it at that time, you will not need to provide a width because the function will automatically determine the width of the containing element. It's unlikely that you will need to use this function but if you notice your slider not sizing properly when it first appears on your page, you may want to try calling this function.
* **disable**: *(disable( [true | false] ))* a function that disables or enables a slider control. Calling disable with no parameter or true as the parameter will disable a slider control if it is not already disabled. Calling this function with a parameter of false will re-enable the slider if it had been disabled before.

One more way to interact with your slider controls is to use the hidden inputs that are created when a sliderId or a data-slider-id attribute is provided at the time the slider is created. The values of those inputs are kept in sync with the slider's from and to values. You can simply reference those values when you need them or add an event listener to the input's change event. 
