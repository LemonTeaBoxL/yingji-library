'use strict';
if(window.yingji?.onWindowState)window.yingji.onWindowState(value=>document.body.classList.toggle('window-maximized',!!value.maximized));
