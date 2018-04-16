/**
 *  The Virtual Keyboard Detector
 */

var virtualKeyboardDetector = ( function( window, undefined ) {
	var touched = false;

  var recentlyFocusedTimeoutDuration = 3000;
  
  var currentViewportWidth, previousViewportWidth, viewportWidthWithoutVirtualKeyboard, currentViewportHeight, previousViewportHeight, viewportHeightWithoutVirtualKeyboard;
  
  currentViewportWidth = previousViewportWidth = viewportWidthWithoutVirtualKeyboard = window.innerWidth;
  currentViewportHeight = previousViewportHeight = viewportHeightWithoutVirtualKeyboard = window.innerHeight;

  var virtualKeyboardVisible = false;
  var recentlyFocused = false;
  var recentlyFocusedTimeout = null;
  var validFocusableElements = [ 'INPUT', 'TEXTAREA' ];

  var subscriptions = {};


  /**
   * Public functions
   */

  function init ( options ) {
    if ( typeof options !== 'undefined' ) {
      if ( typeof options.recentlyFocusedTimeoutDuration !== 'undefined' ) recentlyFocusedTimeoutDuration = options.recentlyFocusedTimeoutDuration;
    }

    resetViewportSizes();
    initFocusListener();
    initResizeListener();
  }

  function isVirtualKeyboardVisible () {
    return virtualKeyboardVisible;
  }

  function getVirtualKeyboardSize () {
    if ( !virtualKeyboardVisible ) return false;
    
    return {
      width: currentViewportWidth,
      height: viewportHeightWithoutVirtualKeyboard - currentViewportHeight
    };
  }

  // Subscribe
  function on ( eventName, fn ) {
    if ( typeof subscriptions[eventName] === 'undefined' ) subscriptions[eventName] = [];

    subscriptions[eventName].push(fn);
  }

  // Unsubscribe
  function off ( eventName, fn ) {
    if (typeof subscriptions[eventName] === 'undefined' ) return;

    if (typeof fn === 'undefined') {
      subscriptions[eventName] = [];
    } else {
      var i = subscriptions[eventName].length;
      while ( i-- ) {
        if ( subscriptions[eventName][i] == fn ) subscriptions[eventName].splice(i, 1);
      }
    }
  }

  // Publish
  function trigger ( eventName, args ) {
    for ( var i in subscriptions[eventName] ) {
      if ( typeof subscriptions[eventName][i] === 'function' ) subscriptions[eventName][i]( args );
    }   
  }


  /**
   * Private functions
   */

  // Reset all sizes. We presume the virtual keyboard is not visible at this stage.
  // We call this function on initialisation, so make sure you initialise the virtualKeyBoardListener at a moment when the virtual keyboard is likely to be invisible.
  function resetViewportSizes () {
    currentViewportWidth = previousViewportWidth = viewportWidthWithoutVirtualKeyboard = window.innerWidth;
    currentViewportHeight = previousViewportHeight = viewportHeightWithoutVirtualKeyboard = window.innerHeight;
  }

  // Initialise the listener that checks for focus events in the whole document. This way we can also handle dynamically added focusable elements.
  function initFocusListener () {
    document.addEventListener( 'focus', documentFocusHandler, true );
  }

  // Handle the document focus event. We check if the target was a valid focusable element.
  function documentFocusHandler (e) {
    if (typeof e.target !== 'undefined' && typeof e.target.nodeName !== 'undefined') {
      if (validFocusableElements.indexOf(e.target.nodeName) != -1) elementFocusHandler(e);
    }
  }

  // Handle the case when a valid focusable element is focused. We flag that a valid element was recently focused. This flag expires after recentlyFocusedTimeoutDuration.
  function elementFocusHandler (e) {
    if ( recentlyFocusedTimeout !== null ) {
      window.clearTimeout( recentlyFocusedTimeout );
      recentlyFocusedTimeout = null;
    }

    recentlyFocused = true;

    recentlyFocusedTimeout = window.setTimeout( expireRecentlyFocused, recentlyFocusedTimeoutDuration );
  }

  function expireRecentlyFocused () {
    recentlyFocused = false;
  }

  function initResizeListener () {
    window.addEventListener( 'touchstart', touchHandler );
    window.addEventListener( 'resize', resizeHandler );
  }
  
  function touchHandler() {
  	touched = true;
  }

  function resizeHandler () {
  	if (!touched) {
  		return false;
  	}
  	
    currentViewportWidth = window.innerWidth;
    currentViewportHeight = window.innerHeight;

    // If the virtual keyboard is tought to be visible, but the viewport height returns to the value before keyboard was visible, we presume the keyboard was hidden.
    if ( virtualKeyboardVisible && currentViewportWidth == previousViewportWidth && currentViewportHeight >= viewportHeightWithoutVirtualKeyboard ) {
      virtualKeyboardHiddenHandler();
    }

    // If the width of the viewport is changed, it's hard to tell wether virtual keyboard is still visible, so we make sure it's not.
    if ( currentViewportWidth != previousViewportWidth ) {
      if ( 'activeElement' in document )
        document.activeElement.blur();
      virtualKeyboardHiddenHandler();
    }

    // If recently focused and viewport height is smaller then previous height, we presume that the virtual keyboard has appeared.
    if ( !virtualKeyboardVisible && recentlyFocused && currentViewportWidth == previousViewportWidth && currentViewportHeight < previousViewportHeight ) {
      virtualKeyboardVisibleHandler();
    }   

    // If the keyboard is presumed not visible, we save the current measurements as values before keyboard was shown.
    if ( virtualKeyboardVisible === false ) {
      viewportWidthWithoutVirtualKeyboard = currentViewportWidth;
      viewportHeightWithoutVirtualKeyboard = currentViewportHeight;
    }

    previousViewportWidth = currentViewportWidth;
    previousViewportHeight = currentViewportHeight;
  }

  function virtualKeyboardVisibleHandler () {
    virtualKeyboardVisible = true;

    var eventData = {
      virtualKeyboardVisible: virtualKeyboardVisible,
      sizes: getSizesData()
    };

    trigger( 'virtualKeyboardVisible', eventData );
  }

  function virtualKeyboardHiddenHandler () {
    virtualKeyboardVisible = false;

    var eventData = {
      virtualKeyboardVisible: virtualKeyboardVisible,
      sizes: getSizesData()
    };

    trigger( 'virtualKeyboardHidden', eventData );
  }

  function getSizesData () {
    return {
      viewportWithoutVirtualKeyboard: {
        width: viewportWidthWithoutVirtualKeyboard,
        height: viewportHeightWithoutVirtualKeyboard
      },
      currentViewport: {
        width: currentViewportWidth,
        height: currentViewportHeight
      },
      virtualKeyboard: {
        width: currentViewportWidth,
        height: viewportHeightWithoutVirtualKeyboard - currentViewportHeight
      }
    };
  }

  // Make public functions available
  return {
    init: init,
    isVirtualKeyboardVisible: isVirtualKeyboardVisible,
    getVirtualKeyboardSize: getVirtualKeyboardSize,
    on: on,
    addEventListener: on,
    subscribe: on,
    off: off,
    removeEventListener: off,
    unsubscribe: off,
    trigger: trigger,
    publish: trigger,
    dispatchEvent: trigger
  };

} )( window );
