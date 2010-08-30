iPhone Shopping List
====================

A shopping list web app for iPhone that is designed to be used offline as well.
To test the application, visit [http://dev.gysserae.ro/shopping/app/] from your 
iPhone, iPod, iPad or any WebKit browser (Safari, Chrome, etc). 


Features
--------

* Multiple lists
* Calculating total for items in the cart (useful while shopping)
* All data saved locally (using HTML5 storage)
* iPhone user interface look-alike (powered by [iWebKit](http://iwebkit.net/))


Futher development
------------------

* Drag sorting the lists must be implemented
* Sync data with a remote JSON storage


Caveats
-------

* CSS transitions in iOS Safari are slow (tested on iPhone 3G, iOS 3)
* The web app is not intended to work on other devices and/or browsers, but is 
  expected to perform well on any HTML5 supporting browser. The only problem
  is the WebKitTransitionEnd event fired only by WebKit browsers that support
  transitions.
