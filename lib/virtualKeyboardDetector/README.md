# Virtual Keyboard Detector
Virtual Keyboard Detector is a **very** simple javascript library that tries to detect when a devices virtual keyboard appears and disappears.

## How it works
It works by combining an input focus listener and a window resize listener. We look for input focus events followed by a viewport height decrease. If shortly after the user focuses on an input field, the height of the viewport decreases while the width of the viewport stays the same, we presume that the virtual keyboard has appeared. When later the height reaches its previous value again, we presume the virtual keyboard has disappeared.

## Caveats
* Only works with virtual keyboards that actually flatten the viewport vertically (most Android keyboards). Keyboards that overlay the viewport without decreasing the viewport height, or keyboards that flatten the viewport horizontally, will not be detected. 
* Other events that suddenly decrease the viewport height while maintaining the same viewport width, shortly after an input focus event, will also be seen as the appearing of a virtual keyboard.
* For now this library has no functionality built-in to detect whether the device is a touch device, or whether the device has a virtual keyboard at all. If you use VirtualKeyboardDetector on a desktop browser, focus on an input field and shortly thereafter decrease the viewport height, it will think a virtual keyboard has appeared. You can detect whether the device supports touch to rule out some, but not all, of these false positives.

## Device support
Works on devices that have a virtual keyboard that resizes the viewport vertically.

## How to use
```javascript
// Start listening for virtual keyboard (dis)appearences
virtualKeyboardDetector.init( { recentlyFocusedTimeoutDuration: 3000 } );
// Handle the appearing of the virtual keyboard
virtualKeyboardDetector.on( 'virtualKeyboardVisible', virtualKeyboardVisibleHandler );
// Handle the disappearing of the virtual keyboard
virtualKeyboardDetector.on( 'virtualKeyboardHidden', virtualKeyboardHiddenHandler );
```

## API
### ```.init( options:Object )```
You have to initialise the VirtualKeyboarDetector before you can start listening for virtual keyboard events. You do this by calling ```virtualKeyboardDetector.init( ... )```. You can pass an object that defines the options. The only option available at this moment is:
* *recentlyFocusedTimeoutDuration*: the maximum amount of time (in milliseconds) between an input focus event and a viewport height decrease event, in which the two are considered to have a causal link. If the amount of time between the focus event and the viewport resize event exceeds this value, we presume the height decrease was not caused by the input focus event, therefore the height decrease was probably not caused by the appearing of a virtual keyboard.

### ```.on( eventName:String, handler:Function )```
This is used to add a listener to the events that are emitted by the VirtualKeyboardDetector object.

Alternatively, you can also use the following **aliases**:
* ```.addEventListener( eventName:String, handler:Function )```
* ```.subscribe( eventName:String, handler:Function )```

### ```.off( eventName:String, handler:Function (optional) )```
This is used to remove listeners from events that were previously added with ".on()" (or one of its aliases). The second parameter is the callback function: if you leave this optional parameter out, it will remove all the listeners for the event that is specified in the first parameter.

Alternatively, you can also use the following **aliases**:
* ```.removeEventListener( eventName:String, handler:Function (optional) )```
* ```.off( eventName:String, handler:Function (optional) )```

### ```.trigger( eventName:String )```
This is used to manually trigger a VirtualKeyboardDetector event.

Alternatively, you can also use the following **aliases**:
* ```.publish( eventName:String )```
* ```.dispatchEvent( eventName:String )```

### ```.isVirtualKeyboardVisible()```
This function returns a boolean that tells us whether the virtual keyboard is presumed visible or not.

### ```.getVirtualKeyboardSize()```
This function returns object in the form of ```{ width:Float, height:Float }```. These are the presumed dimensions of the virtual keyboard. If the virtual keyboard is presumed to be hidden, it returns ```false```.

## Events
The following events are triggered by the VirtualKeyboardDetector:
* *virtualKeyboardVisible*: fires when the virtual keyboard appears
* *virtualKeyboardHidden*: fires when the virtual keyboard disappears