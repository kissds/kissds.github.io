// page init
jQuery(function(){
  initVideoBg();
  initMobileNav();
  initGallery();
  initPopups();
  initPage();
  initMainNav();
  initScrollTop();
  initTouchNav();
});

// video background init
function initVideoBg() {
	var isTouchDevice = /Windows Phone/.test(navigator.userAgent) || ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
   var touchClass = 'is-touch-device';
	if (!isTouchDevice) {
		jQuery('.video-hold').videoBG({
      onInit: function(self) {
        self.resizeHandler();
      }
    });
	} else {
		jQuery('.video-hold').css({'background-image' : 'url(' + jQuery('.video-hold').find('video').attr('poster') + ')'});
     jQuery('body').addClass(touchClass);
	}
}

// handle dropdowns on mobile devices
function initTouchNav() {
  jQuery('#nav').each(function(){
    new TouchNav({
      navBlock: this
    });
  });
}

// mobile menu init
function initMobileNav() {
  var page = jQuery('body');
  var popupClass = 'popup-open';
	jQuery('html').mobileNav({
		menuActiveClass: 'nav-active',
		menuOpener: '.nav-opener',
		menuDrop: '.nav-slide',
    onShow: function() {
      page.addClass(popupClass);
      scrollPageInstance = jQuery('#wrapper').data('PageScroller');
      if(scrollPageInstance) {
        scrollPageInstance.animFlag = true;
      }
    },
    onHide: function() {
      page.removeClass(popupClass);
      scrollPageInstance = jQuery('#wrapper').data('PageScroller');
      if(scrollPageInstance) {
        scrollPageInstance.animFlag = false;
      }
    }
	});
}


// header-fixed init
function initScrollTop() {
  if (jQuery(window).width() < 768) {
    jQuery('#header').classOnScroll({
      fixedClass: 'header-fixed',
      heightRatio: 10
    });
  }
}

// popups init
function initPopups() {
  var scrollPageInstance;
  var page = jQuery('body');
  var popupClass = 'popup-open';
  jQuery('.popup-holder').contentPopup({
    mode: 'click',
    onShow: function() {
      page.addClass(popupClass);
      scrollPageInstance = jQuery('#wrapper').data('PageScroller');
      if(scrollPageInstance) {
        scrollPageInstance.animFlag = true;
      }
    },
    onHide: function() {
      page.removeClass(popupClass);
      scrollPageInstance = jQuery('#wrapper').data('PageScroller');
      if(scrollPageInstance) {
        scrollPageInstance.animFlag = false;
      }
    }
  });
}

// main scroll page function init
function initPage() {
  ResponsiveHelper.addRange({
      '768..': {
          on: function() {
            initDesktopPage();
          },
          off: function() {
            destroyDesktopPage();
          }
      }
  });
}

function  initDesktopPage(){
  jQuery('#wrapper').pageScroller({
    generatePagination: '.main-pagination',
    handleTouch: true,
    onChange: function(self) {
      var header = jQuery('#header');
      var fixedClass = 'header-fixed';
      if (self.index !== 0) {
        if (!header.hasClass(fixedClass)) {
          header.addClass(fixedClass);
        }
      } else {
        header.removeClass(fixedClass);
      }
    }
  });
}

function initMainNav(self) {
  var ind;
  var mobileInstance = jQuery('html').data('MobileNav');
  var pageScrollerInstance = jQuery('#wrapper').data('PageScroller');
  var animSpeed = 800;
  jQuery('.main-nav').each(function() {
    var nav = jQuery(this);
    var links = nav.find('a');
    links.add('.scroll-link').on('click touchstart', function(e) {
      e.preventDefault();
      if (pageScrollerInstance) {
        ind = pageScrollerInstance.sections.index(pageScrollerInstance.sections.filter('[id="' + jQuery(this).attr('href').split('#')[1] +'"]'));
        pageScrollerInstance.goToSection(ind);
      } else {
        SmoothScroll.scrollTo(jQuery(jQuery(this).attr('href')).offset().top, animSpeed);
      }
      if (mobileInstance) {
        mobileInstance.hide();
      }
    });
  });
}

function initGallery(self) {
    jQuery('div.cycle-gallery').scrollGallery({
      mask: 'div.mask',
      slider: 'div.slideset',
      slides: 'div.slide',
      btnPrev: 'a.btn-prev',
      btnNext: 'a.btn-next',
      generatePagination: '.pagination',
      stretchSlideToMask: true,
      circularRotation: false,
      disableWhileAnimating: true,
      maskAutoSize: true,
      autoRotation: false,
      switchTime: 3000,
      animSpeed: 500,
      handleTouch: jQuery(window).width() > 767 ? false : true,
      step: 1,
      onChange: function(that) {
        var pageScrollerInstance = jQuery('#wrapper').data('PageScroller');
        if (pageScrollerInstance) {
          pageScrollerInstance.animFlag = false;
        }
      }
    });
}


function  destroyDesktopPage(){
    var pageInstance = jQuery('#wrapper').data('PageScroller');
    if (pageInstance) {
      pageInstance.destroy();
    }
}


;(function($) {
  'use strict';
  var win = jQuery(window);
  var isTouchDevice = /Windows Phone/.test(navigator.userAgent) || ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
  function PageScroller(options) {
    this.options = $.extend({
      holder: null,
      activeClass: 'active',
      sectionHolder: '#main',
      sections: '.section',
      slides: '.slide',
      animSpeed : 800,
      easing : isTouchDevice? 'linear' : 'easeInCubic',
      delay : 100,
      generatePagination: false,
      pagerList: '<ul>',
      pagerListItem: '<li><a href="#"></a></li>',
      pagerListItemText: 'a',
      handleTouch: false,
      swipeThreshold: 15
    }, options);
    this.init();
  }
  PageScroller.prototype = {
    init: function() {
      if (this.options.holder) {
        this.findElements();
        this.attachEvents();
        this.makeCallback('onInit', this);
      }
    },
    findElements: function() {
      this.page = jQuery('html,body');
      this.wrapper = $(this.options.holder);
      this.sectionHolder = this.wrapper.find(this.options.sectionHolder);
      this.sections =  this.wrapper.find(this.options.sections);
      this.index = 0;
      this.animFlag = false;

      // create gallery pagination
      if(typeof this.options.generatePagination === 'string') {
        this.pagerLinks = $();
        this.buildPagination();
      }

    },
    attachEvents: function() {
      var self = this;
      this.bindHandlers(['onMouseWheel', 'onRefreshPosition']);
      this.page.on('mousewheel', this.onMouseWheel);
      win.on('orientationchange.ScrollPage', function(){
        clearTimeout(self.timer);
        self.timer = setTimeout(self.onRefreshPosition, 100);
      });
    },
    buildPagination: function() {
      if(typeof this.options.generatePagination === 'string') {
        if(!this.pagerHolder) {
          this.pagerHolder = this.wrapper.find(this.options.generatePagination);
        }
        if(this.pagerHolder.length) {
          this.pagerHolder.empty();
          this.pagerList = $(this.options.pagerList).appendTo(this.pagerHolder);
          for(var i = 0; i < this.sections.length; i++) {
            $(this.options.pagerListItem).appendTo(this.pagerList).find(this.options.pagerListItemText).text(i+1);
          }
          this.pagerLinks = this.pagerList.children();
          this.pagerLinks.eq(this.index).addClass(this.options.activeClass);
          this.attachPaginationEvents();
        }
      }
    },
    attachPaginationEvents: function() {
      var self = this;
      this.pagerLinksHandler = function(e) {
        e.preventDefault();
        self.goToSection(self.pagerLinks.index(e.currentTarget));
      };
      this.pagerLinks.on('click', this.pagerLinksHandler);

      this.touchHandler();
    },
    touchHandler: function() {
      var self = this;
      if(window.Hammer && isTouchDevice && this.options.handleTouch) {
        this.swipeHandler = new Hammer.Manager(this.sectionHolder[0]);
        this.swipeHandler.add(new Hammer.Pan({
          direction: Hammer.DIRECTION_VERTICAL,
          threshold: this.options.swipeThreshold
        }));

        // 
        this.swipeHandler.on('panstart', function(e) {
          if(e.distance > self.options.swipeThreshold) {
            self.onSwipe(e);
          }
        });
      }
    },
    onRefreshPosition: function() {
        var self = this; 
        this.sectionHolder.stop().animate({scrollTop: this.sectionHolder.scrollTop() + Math.round(this.sections.eq(this.index).offset().top)},{duration:this.options.animSpeed,easing:this.options.easing, complete: function(){setTimeout(function(){self.animFlag = false;}, self.options.delay)}});
    },
    onSwipe: function(e) {
      var self = this;
      if (!self.animFlag) {
        self.animFlag = true;
        if (self.sections.eq(self.index).find(self.options.slides).length) {
          self.switchSlider(e.offsetDirection === Hammer.DIRECTION_RIGHT || e.offsetDirection === Hammer.DIRECTION_DOWN);
        } else {
          if (e.offsetDirection === Hammer.DIRECTION_RIGHT || e.offsetDirection === Hammer.DIRECTION_DOWN) {
            self.nextSection();
          } else {
            self.prevSection();
          }
        }
       }
    },
    onMouseWheel: function(e) {
      var self = this;
      console.log(self.animFlag);
      if (!self.animFlag) {
        self.animFlag = true;
        if (self.sections.eq(self.index).find(self.options.slides).length) {
          self.switchSlider(e.deltaY < 0);
        } else {
          if (e.deltaY < 0) {
            self.nextSection();
          } else {
            self.prevSection();
          }
        }
       }
    },
    switchSlider: function(direction) {
      var self = this;
      var galleryInstance = self.sections.eq(self.index).find(self.options.slides).parents(self.options.sections).data('ScrollGallery');
      if (galleryInstance) {
        if (direction) {
            if (galleryInstance.currentStep !== galleryInstance.slides.length - 1) {
              galleryInstance.nextSlide();
            } else {
              if (!galleryInstance.galleryAnimating) {
                 self.nextSection();
              }
            }
        } else {
            if (galleryInstance && galleryInstance.currentStep !== 0) {
              galleryInstance.prevSlide();
            } else {
              if (!galleryInstance.galleryAnimating) {
                 self.prevSection();
              }
            } 
        }
      }
    },
    goToSection: function(ind) {
      this.index = ind;
      this.switchSlide();
    },
    nextSection: function() {
      if(this.index < this.sections.length - 1){
        this.index++;
        this.switchSlide();
      }
      else{
        this.animFlag = false;
        return; 
      }
    },
    prevSection: function() {
      if(this.index > 0){
        this.index--;
        this.switchSlide();
      }
      else{
        this.animFlag = false;
        return; 
      }
    },
    switchSlide: function() {
      var self = this;
      this.sectionHolder.stop().animate({
          scrollTop: this.sectionHolder.scrollTop() + Math.round(this.sections.eq(this.index).offset().top)
        },{
          duration:this.options.animSpeed,
          easing:this.options.easing,
          complete: function(){
            setTimeout(function(){
              self.animFlag = false;
              self.refreshActiveLink();
              self.makeCallback('onChange', self);
            }, self.options.delay);
          }
        });
    },
    refreshActiveLink: function() {
      this.pagerLinks.removeClass(this.options.activeClass);
      this.pagerLinks.eq(this.index).addClass(this.options.activeClass);
    },
    bindHandlers: function(handlersList) {
      var self = this;
      $.each(handlersList, function(index, handler) {
        var origHandler = self[handler];
        self[handler] = function() {
          return origHandler.apply(self, arguments);
        };
      });
    },
    makeCallback: function(name) {
      if (typeof this.options[name] === 'function') {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        this.options[name].apply(this, args);
      }
    },
    destroy: function() {
      this.page.off('mousewheel', this.onMouseWheel);
      this.pagerLinks.off('click', this.pagerLinksHandler);
      win.off('orientationchange.ScrollPage');
      if(typeof this.options.generatePagination === 'string') {
        this.pagerHolder.empty();
      }
     if(window.Hammer && isTouchDevice) {
        this.swipeHandler.destroy();
      }
    }
  };

  // jQuery plugin interface
  $.fn.pageScroller = function(options) {
    return this.each(function() {
      var params = $.extend({}, options, {holder: this}),
        instance = new PageScroller(params);
      $.data(this, 'PageScroller', instance);
    });
  };

  // module exports
  window.PageScroller = PageScroller;
}(jQuery));

/*!
 * SmoothScroll module
 */
;(function($, exports) {
  // private variables
  var page,
    win = $(window),
    activeBlock, activeWheelHandler,
    wheelEvents = ('onwheel' in document || document.documentMode >= 9 ? 'wheel' : 'mousewheel DOMMouseScroll');

  // animation handlers
  function scrollTo(offset, options, callback) {
    // initialize variables
    var scrollBlock;
    if (document.body) {
      if (typeof options === 'number') {
        options = { duration: options };
      } else {
        options = options || {};
      }
      page = page || $('html, body');
      scrollBlock = options.container || page;
    } else {
      return;
    }

    // treat single number as scrollTop
    if (typeof offset === 'number') {
      offset = { top: offset };
    }

    // handle mousewheel/trackpad while animation is active
    if (activeBlock && activeWheelHandler) {
      activeBlock.off(wheelEvents, activeWheelHandler);
    }
    if (options.wheelBehavior && options.wheelBehavior !== 'none') {
      activeWheelHandler = function(e) {
        if (options.wheelBehavior === 'stop') {
          scrollBlock.off(wheelEvents, activeWheelHandler);
          scrollBlock.stop();
        } else if (options.wheelBehavior === 'ignore') {
          e.preventDefault();
        }
      };
      activeBlock = scrollBlock.on(wheelEvents, activeWheelHandler);
    }

    // start scrolling animation
    scrollBlock.stop().animate({
      scrollLeft: offset.left,
      scrollTop: offset.top
    }, options.duration, function() {
      if (activeWheelHandler) {
        scrollBlock.off(wheelEvents, activeWheelHandler);
      }
      if ($.isFunction(callback)) {
        callback();
      }
    });
  }

  // smooth scroll contstructor
  function SmoothScroll(options) {
    this.options = $.extend({
      anchorLinks: 'a[href^="#"]',  // selector or jQuery object
      container: null,    // specify container for scrolling (default - whole page)
      extraOffset: null,    // function or fixed number
      activeClasses: null,  // null, "link", "parent"
      easing: 'swing',    // easing of scrolling
      animMode: 'duration', // or "speed" mode
      animDuration: 800,    // total duration for scroll (any distance)
      animSpeed: 1500,    // pixels per second
      anchorActiveClass: 'anchor-active',
      sectionActiveClass: 'section-active',
      wheelBehavior: 'stop', // "stop", "ignore" or "none"
      useNativeAnchorScrolling: false // do not handle click in devices with native smooth scrolling
    }, options);
    this.init();
  }
  SmoothScroll.prototype = {
    init: function() {
      this.initStructure();
      this.attachEvents();
    },
    initStructure: function() {
      var self = this;

      this.container = this.options.container ? $(this.options.container) : $('html,body');
      this.scrollContainer = this.options.container ? this.container : win;
      this.anchorLinks = jQuery(this.options.anchorLinks).filter(function() {
        return document.getElementById(this.getAttribute('href').slice(1));
      });
    },
    getAnchorTarget: function(link) {
      // get target block from link href
      var targetId = $(link).attr('href');
      return $(targetId.length > 1 ? targetId : 'html');
    },
    getTargetOffset: function(block) {
      // get target offset
      var blockOffset = block.offset().top;
      if (this.options.container) {
        blockOffset -= this.container.offset().top - this.container.prop('scrollTop');
      }

      // handle extra offset
      if (typeof this.options.extraOffset === 'number') {
        blockOffset -= this.options.extraOffset;
      } else if (typeof this.options.extraOffset === 'function') {
        blockOffset -= this.options.extraOffset(block);
      }
      return { top: blockOffset };
    },
    attachEvents: function() {
      var self = this;

      // handle active classes
      if (this.options.activeClasses && this.anchorLinks.length) {
        // cache structure
        this.anchorData = [];

        for (var i = 0; i < this.anchorLinks.length; i++) {
          var link = jQuery(this.anchorLinks[i]),
            targetBlock = self.getAnchorTarget(link),
            anchorDataItem;

          $.each(self.anchorData, function(index, item) {
            if (item.block[0] === targetBlock[0]) {
              anchorDataItem = item;
            }
          });

          if (anchorDataItem) {
            anchorDataItem.link = anchorDataItem.link.add(link);
          } else {
            self.anchorData.push({
              link: link,
              block: targetBlock
            });
          }
        };

        // add additional event handlers
        this.resizeHandler = function() {
          self.recalculateOffsets();
        };
        this.scrollHandler = function() {
          self.refreshActiveClass();
        };

        this.recalculateOffsets();
        this.scrollContainer.on('scroll', this.scrollHandler);
        win.on('resize', this.resizeHandler);
      }

      // handle click event
      this.clickHandler = function(e) {
        self.onClick(e);
      };
      if (!this.options.useNativeAnchorScrolling) {
        this.anchorLinks.on('click', this.clickHandler);
      }
    },
    recalculateOffsets: function() {
      var self = this;
      $.each(this.anchorData, function(index, data) {
        data.offset = self.getTargetOffset(data.block);
        data.height = data.block.outerHeight();
      });
      this.refreshActiveClass();
    },
    refreshActiveClass: function() {
      var self = this,
        foundFlag = false,
        containerHeight = this.container.prop('scrollHeight'),
        viewPortHeight = this.scrollContainer.height(),
        scrollTop = this.options.container ? this.container.prop('scrollTop') : win.scrollTop();

      // user function instead of default handler
      if (this.options.customScrollHandler) {
        this.options.customScrollHandler.call(this, scrollTop, this.anchorData);
        return;
      }

      // sort anchor data by offsets
      this.anchorData.sort(function(a, b) {
        return a.offset.top - b.offset.top;
      });
      function toggleActiveClass(anchor, block, state) {
        anchor.toggleClass(self.options.anchorActiveClass, state);
        block.toggleClass(self.options.sectionActiveClass, state);
      }

      // default active class handler
      $.each(this.anchorData, function(index) {
        var reverseIndex = self.anchorData.length - index - 1,
          data = self.anchorData[reverseIndex],
          anchorElement = (self.options.activeClasses === 'parent' ? data.link.parent() : data.link);

        if (scrollTop >= containerHeight - viewPortHeight) {
          // handle last section
          if (reverseIndex === self.anchorData.length - 1) {
            toggleActiveClass(anchorElement, data.block, true);
          } else {
            toggleActiveClass(anchorElement, data.block, false);
          }
        } else {
          // handle other sections
          if (!foundFlag && (scrollTop >= data.offset.top - 1 || reverseIndex === 0)) {
            foundFlag = true;
            toggleActiveClass(anchorElement, data.block, true);
          } else {
            toggleActiveClass(anchorElement, data.block, false);
          }
        }
      });
    },
    calculateScrollDuration: function(offset) {
      var distance;
      if (this.options.animMode === 'speed') {
        distance = Math.abs(this.scrollContainer.scrollTop() - offset.top);
        return (distance / this.options.animSpeed) * 1000;
      } else {
        return this.options.animDuration;
      }
    },
    onClick: function(e) {
      var targetBlock = this.getAnchorTarget(e.currentTarget),
        targetOffset = this.getTargetOffset(targetBlock);

      e.preventDefault();
      scrollTo(targetOffset, {
        container: this.container,
        wheelBehavior: this.options.wheelBehavior,
        duration: this.calculateScrollDuration(targetOffset)
      });
    },
    destroy: function() {
      if (this.options.activeClasses) {
        win.off('resize', this.resizeHandler);
        this.scrollContainer.off('scroll', this.scrollHandler);
      }
      this.anchorLinks.off('click', this.clickHandler);
    }
  };

  // public API
  $.extend(SmoothScroll, {
    scrollTo: function(blockOrOffset, durationOrOptions, callback) {
      scrollTo(blockOrOffset, durationOrOptions, callback);
    }
  });

  // export module
  exports.SmoothScroll = SmoothScroll;
}(jQuery, this));

/*
 * jQuery Carousel plugin
 */
;(function($){
  function ScrollGallery(options) {
    this.options = $.extend({
      mask: 'div.mask',
      slider: '>*',
      slides: '>*',
      activeClass:'active',
      disabledClass:'disabled',
      btnPrev: 'a.btn-prev',
      btnNext: 'a.btn-next',
      generatePagination: false,
      pagerList: '<ul>',
      pagerListItem: '<li><a href="#"></a></li>',
      pagerListItemText: 'a',
      pagerLinks: '.pagination li',
      currentNumber: 'span.current-num',
      totalNumber: 'span.total-num',
      btnPlay: '.btn-play',
      btnPause: '.btn-pause',
      btnPlayPause: '.btn-play-pause',
      galleryReadyClass: 'gallery-js-ready',
      autorotationActiveClass: 'autorotation-active',
      autorotationDisabledClass: 'autorotation-disabled',
      stretchSlideToMask: false,
      circularRotation: true,
      disableWhileAnimating: false,
      autoRotation: false,
      pauseOnHover: isTouchDevice ? false : true,
      maskAutoSize: false,
      switchTime: 4000,
      animSpeed: 600,
      event:'click',
      swipeThreshold: 15,
      handleTouch: true,
      vertical: false,
      useTranslate3D: false,
      step: false
    }, options);
    this.init();
  }
  ScrollGallery.prototype = {
    init: function() {
      if(this.options.holder) {
        this.findElements();
        this.attachEvents();
        this.refreshPosition();
        this.refreshState(true);
        this.resumeRotation();
        this.makeCallback('onInit', this);
      }
    },
    findElements: function() {
      // define dimensions proporties
      this.fullSizeFunction = this.options.vertical ? 'outerHeight' : 'outerWidth';
      this.innerSizeFunction = this.options.vertical ? 'height' : 'width';
      this.slideSizeFunction = 'outerHeight';
      this.maskSizeProperty = 'height';
      this.animProperty = this.options.vertical ? 'marginTop' : 'marginLeft';

      // control elements
      this.gallery = $(this.options.holder).addClass(this.options.galleryReadyClass);
      this.mask = this.gallery.find(this.options.mask);
      this.slider = this.mask.find(this.options.slider);
      this.slides = this.slider.find(this.options.slides);
      this.btnPrev = this.gallery.find(this.options.btnPrev);
      this.btnNext = this.gallery.find(this.options.btnNext);
      this.currentStep = 0; this.stepsCount = 0;

      // get start index
      if(this.options.step === false) {
        var activeSlide = this.slides.filter('.'+this.options.activeClass);
        if(activeSlide.length) {
          this.currentStep = this.slides.index(activeSlide);
        }
      }

      // calculate offsets
      this.calculateOffsets();

      // create gallery pagination
      if(typeof this.options.generatePagination === 'string') {
        this.pagerLinks = $();
        this.buildPagination();
      } else {
        this.pagerLinks = this.gallery.find(this.options.pagerLinks);
        this.attachPaginationEvents();
      }

      // autorotation control buttons
      this.btnPlay = this.gallery.find(this.options.btnPlay);
      this.btnPause = this.gallery.find(this.options.btnPause);
      this.btnPlayPause = this.gallery.find(this.options.btnPlayPause);

      // misc elements
      this.curNum = this.gallery.find(this.options.currentNumber);
      this.allNum = this.gallery.find(this.options.totalNumber);
    },
    attachEvents: function() {
      // bind handlers scope
      var self = this;
      this.bindHandlers(['onWindowResize']);
      $(window).bind('load resize orientationchange', this.onWindowResize);

      // previous and next button handlers
      if(this.btnPrev.length) {
        this.prevSlideHandler = function(e) {
          e.preventDefault();
          self.prevSlide();
        };
        this.btnPrev.bind(this.options.event, this.prevSlideHandler);
      }
      if(this.btnNext.length) {
        this.nextSlideHandler = function(e) {
          e.preventDefault();
          self.nextSlide();
        };
        this.btnNext.bind(this.options.event, this.nextSlideHandler);
      }

      // pause on hover handling
      if(this.options.pauseOnHover && !isTouchDevice) {
        this.hoverHandler = function() {
          if(self.options.autoRotation) {
            self.galleryHover = true;
            self.pauseRotation();
          }
        };
        this.leaveHandler = function() {
          if(self.options.autoRotation) {
            self.galleryHover = false;
            self.resumeRotation();
          }
        };
        this.gallery.bind({mouseenter: this.hoverHandler, mouseleave: this.leaveHandler});
      }

      // autorotation buttons handler
      if(this.btnPlay.length) {
        this.btnPlayHandler = function(e) {
          e.preventDefault();
          self.startRotation();
        };
        this.btnPlay.bind(this.options.event, this.btnPlayHandler);
      }
      if(this.btnPause.length) {
        this.btnPauseHandler = function(e) {
          e.preventDefault();
          self.stopRotation();
        };
        this.btnPause.bind(this.options.event, this.btnPauseHandler);
      }
      if(this.btnPlayPause.length) {
        this.btnPlayPauseHandler = function(e) {
          e.preventDefault();
          if(!self.gallery.hasClass(self.options.autorotationActiveClass)) {
            self.startRotation();
          } else {
            self.stopRotation();
          }
        };
        this.btnPlayPause.bind(this.options.event, this.btnPlayPauseHandler);
      }

      // enable hardware acceleration
      if(isTouchDevice && this.options.useTranslate3D) {
        this.slider.css({'-webkit-transform': 'translate3d(0px, 0px, 0px)'});
      }

      // swipe event handling
      if(isTouchDevice && this.options.handleTouch && window.Hammer && this.mask.length) {
        this.swipeHandler = new Hammer.Manager(this.mask[0]);
        this.swipeHandler.add(new Hammer.Pan({
          direction: self.options.vertical ? Hammer.DIRECTION_VERTICAL : Hammer.DIRECTION_HORIZONTAL,
          threshold: self.options.swipeThreshold
        }));

        this.swipeHandler.on('panstart', function() {
          if(self.galleryAnimating) {
            self.swipeHandler.stop();
          } else {
            self.pauseRotation();
            self.originalOffset = parseFloat(self.slider.css(self.animProperty));
          }
        }).on('panmove', function(e) {
          var tmpOffset = self.originalOffset + e[self.options.vertical ? 'deltaY' : 'deltaX'];
          tmpOffset = Math.max(Math.min(0, tmpOffset), self.maxOffset);
          self.slider.css(self.animProperty, tmpOffset);
        }).on('panend', function(e) {
          self.resumeRotation();
          if(e.distance > self.options.swipeThreshold) {
            if(e.offsetDirection === Hammer.DIRECTION_RIGHT || e.offsetDirection === Hammer.DIRECTION_DOWN) {
              self.nextSlide();
            } else {
              self.prevSlide();
            }
          } else {
            self.switchSlide();
          }
        });
      }
    },
    onWindowResize: function() {
      if(!this.galleryAnimating) {
        this.calculateOffsets();
        this.refreshPosition();
        this.buildPagination();
        this.refreshState();
        this.resizeQueue = false;
      } else {
        this.resizeQueue = true;
      }
    },
    refreshPosition: function() {
      this.currentStep = Math.min(this.currentStep, this.stepsCount - 1);
      this.tmpProps = {};
      this.tmpProps[this.animProperty] = this.getStepOffset();
      this.slider.stop().css(this.tmpProps);
    },
    calculateOffsets: function() {
      var self = this, tmpOffset, tmpStep;
      if(this.options.stretchSlideToMask) {
        var tmpObj = {};
        tmpObj[this.innerSizeFunction] = this.mask[this.innerSizeFunction]();
        this.slides.css(tmpObj);
      }

      this.maskSize = this.mask[this.innerSizeFunction]();
      this.sumSize = this.getSumSize();
      this.maxOffset = this.maskSize - this.sumSize;

      // vertical gallery with single size step custom behavior
      if(this.options.vertical && this.options.maskAutoSize) {
        this.options.step = 1;
        this.stepsCount = this.slides.length;
        this.stepOffsets = [0];
        tmpOffset = 0;
        for(var i = 0; i < this.slides.length; i++) {
          tmpOffset -= $(this.slides[i])[this.fullSizeFunction](true);
          this.stepOffsets.push(tmpOffset);
        }
        this.maxOffset = tmpOffset;
        return;
      }

      // scroll by slide size
      if(typeof this.options.step === 'number' && this.options.step > 0) {
        this.slideDimensions = [];
        this.slides.each($.proxy(function(ind, obj){
          self.slideDimensions.push( $(obj)[self.fullSizeFunction](true) );
        },this));

        // calculate steps count
        this.stepOffsets = [0];
        this.stepsCount = 1;
        tmpOffset = tmpStep = 0;
        while(tmpOffset > this.maxOffset) {
          tmpOffset -= this.getSlideSize(tmpStep, tmpStep + this.options.step);
          tmpStep += this.options.step;
          this.stepOffsets.push(Math.max(tmpOffset, this.maxOffset));
          this.stepsCount++;
        }
      }
      // scroll by mask size
      else {
        // define step size
        this.stepSize = this.maskSize;

        // calculate steps count
        this.stepsCount = 1;
        tmpOffset = 0;
        while(tmpOffset > this.maxOffset) {
          tmpOffset -= this.stepSize;
          this.stepsCount++;
        }
      }
    },
    getSumSize: function() {
      var sum = 0;
      this.slides.each($.proxy(function(ind, obj){
        sum += $(obj)[this.fullSizeFunction](true);
      },this));
      this.slider.css(this.innerSizeFunction, sum);
      return sum;
    },
    getStepOffset: function(step) {
      step = step || this.currentStep;
      if(typeof this.options.step === 'number') {
        return this.stepOffsets[this.currentStep];
      } else {
        return Math.min(0, Math.max(-this.currentStep * this.stepSize, this.maxOffset));
      }
    },
    getSlideSize: function(i1, i2) {
      var sum = 0;
      for(var i = i1; i < Math.min(i2, this.slideDimensions.length); i++) {
        sum += this.slideDimensions[i];
      }
      return sum;
    },
    buildPagination: function() {
      if(typeof this.options.generatePagination === 'string') {
        if(!this.pagerHolder) {
          this.pagerHolder = this.gallery.find(this.options.generatePagination);
        }
        if(this.pagerHolder.length && this.oldStepsCount != this.stepsCount) {
          this.oldStepsCount = this.stepsCount;
          this.pagerHolder.empty();
          this.pagerList = $(this.options.pagerList).appendTo(this.pagerHolder);
          for(var i = 0; i < this.stepsCount; i++) {
            $(this.options.pagerListItem).appendTo(this.pagerList).find(this.options.pagerListItemText).text(i+1);
          }
          this.pagerLinks = this.pagerList.children();
          this.attachPaginationEvents();
        }
      }
    },
    attachPaginationEvents: function() {
      var self = this;
      this.pagerLinksHandler = function(e) {
        e.preventDefault();
        self.numSlide(self.pagerLinks.index(e.currentTarget));
      };
      this.pagerLinks.bind(this.options.event, this.pagerLinksHandler);
    },
    prevSlide: function() {
      if(!(this.options.disableWhileAnimating && this.galleryAnimating)) {
        if(this.currentStep > 0) {
          this.currentStep--;
          this.switchSlide();
        } else if(this.options.circularRotation) {
          this.currentStep = this.stepsCount - 1;
          this.switchSlide();
        }
      }
    },
    nextSlide: function(fromAutoRotation) {
      if(!(this.options.disableWhileAnimating && this.galleryAnimating)) {
        if(this.currentStep < this.stepsCount - 1) {
          this.currentStep++;
          this.switchSlide();
        } else if(this.options.circularRotation || fromAutoRotation === true) {
          this.currentStep = 0;
          this.switchSlide();
        }
      }
    },
    numSlide: function(c) {
      if(this.currentStep != c) {
        this.currentStep = c;
        this.switchSlide();
      }
    },
    switchSlide: function() {
      var self = this;
      this.galleryAnimating = true;
      this.tmpProps = {};
      this.tmpProps[this.animProperty] = this.getStepOffset();
      this.slider.stop().animate(this.tmpProps, {duration: this.options.animSpeed, complete: function(){
        // animation complete
        self.galleryAnimating = false;
        if(self.resizeQueue) {
          self.onWindowResize();
        }

        // onchange callback
        self.makeCallback('onChange', self);
        self.autoRotate();
      }});
      this.refreshState();

      // onchange callback
      this.makeCallback('onBeforeChange', this);
    },
    refreshState: function(initial) {
      if(this.options.step === 1 || this.stepsCount === this.slides.length) {
        this.slides.removeClass(this.options.activeClass).eq(this.currentStep).addClass(this.options.activeClass);
      }
      this.pagerLinks.removeClass(this.options.activeClass).eq(this.currentStep).addClass(this.options.activeClass);
      this.curNum.html(this.currentStep+1);
      this.allNum.html(this.stepsCount);

      // initial refresh
      if(this.options.maskAutoSize && typeof this.options.step === 'number') {
        this.tmpProps = {};
        this.tmpProps[this.maskSizeProperty] = this.slides.eq(Math.min(this.currentStep,this.slides.length-1))[this.slideSizeFunction](true);
        this.mask.stop()[initial ? 'css' : 'animate'](this.tmpProps);
      }

      // disabled state
      if(!this.options.circularRotation) {
        this.btnPrev.add(this.btnNext).removeClass(this.options.disabledClass);
        if(this.currentStep === 0) this.btnPrev.addClass(this.options.disabledClass);
        if(this.currentStep === this.stepsCount - 1) this.btnNext.addClass(this.options.disabledClass);
      }

      // add class if not enough slides
      this.gallery.toggleClass('not-enough-slides', this.sumSize <= this.maskSize);
    },
    startRotation: function() {
      this.options.autoRotation = true;
      this.galleryHover = false;
      this.autoRotationStopped = false;
      this.resumeRotation();
    },
    stopRotation: function() {
      this.galleryHover = true;
      this.autoRotationStopped = true;
      this.pauseRotation();
    },
    pauseRotation: function() {
      this.gallery.addClass(this.options.autorotationDisabledClass);
      this.gallery.removeClass(this.options.autorotationActiveClass);
      clearTimeout(this.timer);
    },
    resumeRotation: function() {
      if(!this.autoRotationStopped) {
        this.gallery.addClass(this.options.autorotationActiveClass);
        this.gallery.removeClass(this.options.autorotationDisabledClass);
        this.autoRotate();
      }
    },
    autoRotate: function() {
      var self = this;
      clearTimeout(this.timer);
      if(this.options.autoRotation && !this.galleryHover && !this.autoRotationStopped) {
        this.timer = setTimeout(function(){
          self.nextSlide(true);
        }, this.options.switchTime);
      } else {
        this.pauseRotation();
      }
    },
    bindHandlers: function(handlersList) {
      var self = this;
      $.each(handlersList, function(index, handler) {
        var origHandler = self[handler];
        self[handler] = function() {
          return origHandler.apply(self, arguments);
        };
      });
    },
    makeCallback: function(name) {
      if(typeof this.options[name] === 'function') {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        this.options[name].apply(this, args);
      }
    },
    destroy: function() {
      // destroy handler
      $(window).unbind('load resize orientationchange', this.onWindowResize);
      this.btnPrev.unbind(this.options.event, this.prevSlideHandler);
      this.btnNext.unbind(this.options.event, this.nextSlideHandler);
      this.pagerLinks.unbind(this.options.event, this.pagerLinksHandler);
      this.gallery.unbind('mouseenter', this.hoverHandler);
      this.gallery.unbind('mouseleave', this.leaveHandler);

      // autorotation buttons handlers
      this.stopRotation();
      this.btnPlay.unbind(this.options.event, this.btnPlayHandler);
      this.btnPause.unbind(this.options.event, this.btnPauseHandler);
      this.btnPlayPause.unbind(this.options.event, this.btnPlayPauseHandler);

      // destroy swipe handler
      if(this.swipeHandler) {
        this.swipeHandler.destroy();
      }

      // remove inline styles, classes and pagination
      var unneededClasses = [this.options.galleryReadyClass, this.options.autorotationActiveClass, this.options.autorotationDisabledClass];
      this.gallery.removeClass(unneededClasses.join(' '));
      this.slider.add(this.slides).removeAttr('style');
      if(typeof this.options.generatePagination === 'string') {
        this.pagerHolder.empty();
      }
    }
  };

  // detect device type
  var isTouchDevice = /Windows Phone/.test(navigator.userAgent) || ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;

  // jquery plugin
  $.fn.scrollGallery = function(opt){
    return this.each(function(){
      $(this).data('ScrollGallery', new ScrollGallery($.extend(opt,{holder:this})));
    });
  };
}(jQuery));

/*
 * Popups plugin
 */
;(function($) {
  var isTouchDevice = /Windows Phone/.test(navigator.userAgent) || ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
  function ContentPopup(opt) {
    this.options = $.extend({
      holder: null,
      popup: '.popup',
      btnOpen: '.open',
      btnClose: '.close',
      openClass: 'popup-active',
      hoverClass: 'hover',
      clickEvent: 'click',
      mode: 'click',
      hideOnClickLink: true,
      hideOnClickOutside: true,
      delay: 50
    }, opt);
    if(this.options.holder) {
      this.holder = $(this.options.holder);
      this.init();
    }
  }
  ContentPopup.prototype = {
    init: function() {
      this.findElements();
      this.attachEvents();
    },
    findElements: function() {
      this.popup = this.holder.find(this.options.popup);
      this.btnOpen = this.holder.find(this.options.btnOpen);
      this.btnClose = this.holder.find(this.options.btnClose);
    },
    attachEvents: function() {
      // handle popup openers
      var self = this;
      this.clickMode = isTouchDevice || (self.options.mode === self.options.clickEvent);

      if(this.clickMode) {
        // handle click mode
        this.btnOpen.bind(self.options.clickEvent, function(e) {
          var link = jQuery(this);
          if (isTouchDevice) {
            if(!link.hasClass(self.options.hoverClass)) {
             link.addClass(self.options.hoverClass);
            } else {
              if(self.holder.hasClass(self.options.openClass)) {
                if(self.options.hideOnClickLink) {
                  self.hidePopup();
                }
              } else {
                self.showPopup();
              }
            }
          } else{
            if(self.holder.hasClass(self.options.openClass)) {
              if(self.options.hideOnClickLink) {
                self.hidePopup();
              }
            } else {
              self.showPopup();
            }
          }
          e.preventDefault();
        });

        // prepare outside click handler
        this.outsideClickHandler = this.bind(this.outsideClickHandler, this);
      } else {
        // handle hover mode
        var timer, delayedFunc = function(func) {
          clearTimeout(timer);
          timer = setTimeout(function() {
            func.call(self);
          }, self.options.delay);
        };
        this.btnOpen.bind('mouseover', function() {
          delayedFunc(self.showPopup);
        }).bind('mouseout', function() {
          delayedFunc(self.hidePopup);
        });
        this.popup.bind('mouseover', function() {
          delayedFunc(self.showPopup);
        }).bind('mouseout', function() {
          delayedFunc(self.hidePopup);
        });
      }

      // handle close buttons
      this.btnClose.bind(self.options.clickEvent, function(e) {
        self.hidePopup();
        e.preventDefault();
      });
    },
    outsideClickHandler: function(e) {
      // hide popup if clicked outside
      var targetNode = $((e.changedTouches ? e.changedTouches[0] : e).target);
      if(!targetNode.closest(this.popup).length && !targetNode.closest(this.btnOpen).length) {
        this.hidePopup();
      }
    },
    showPopup: function() {
      // reveal popup
      this.holder.addClass(this.options.openClass);
      this.popup.css({display:'block'});
      if (typeof this.options.onShow === 'function') this.options.onShow(this);

      // outside click handler
      if(this.clickMode && this.options.hideOnClickOutside && !this.outsideHandlerActive) {
        this.outsideHandlerActive = true;
        $(document).bind('click touchstart', this.outsideClickHandler);
      }
    },
    hidePopup: function() {
      // hide popup
      this.holder.removeClass(this.options.openClass);
      this.popup.css({display:'none'});
      this.btnOpen.removeClass(this.options.hoverClass);
      if (typeof this.options.onHide === 'function') this.options.onHide(this);

      // outside click handler
      if(this.clickMode && this.options.hideOnClickOutside && this.outsideHandlerActive) {
        this.outsideHandlerActive = false;
        $(document).unbind('click touchstart', this.outsideClickHandler);
      }
    },
    bind: function(f, scope, forceArgs){
      return function() {return f.apply(scope, forceArgs ? [forceArgs] : arguments);};
    }
  };

  // detect touch devices
  var isTouchDevice = /Windows Phone/.test(navigator.userAgent) || ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;

  // jQuery plugin interface
  $.fn.contentPopup = function(opt) {
    return this.each(function() {
      new ContentPopup($.extend(opt, {holder: this}));
    });
  };
}(jQuery));

/*
 * Responsive Layout helper
 */
ResponsiveHelper = (function($){
  // init variables
  var handlers = [],
    prevWinWidth,
    win = $(window),
    nativeMatchMedia = false;

  // detect match media support
  if(window.matchMedia) {
    if(window.Window && window.matchMedia === Window.prototype.matchMedia) {
      nativeMatchMedia = true;
    } else if(window.matchMedia.toString().indexOf('native') > -1) {
      nativeMatchMedia = true;
    }
  }

  // prepare resize handler
  function resizeHandler() {
    var winWidth = win.width();
    if(winWidth !== prevWinWidth) {
      prevWinWidth = winWidth;

      // loop through range groups
      $.each(handlers, function(index, rangeObject){
        // disable current active area if needed
        $.each(rangeObject.data, function(property, item) {
          if(item.currentActive && !matchRange(item.range[0], item.range[1])) {
            item.currentActive = false;
            if(typeof item.disableCallback === 'function') {
              item.disableCallback();
            }
          }
        });

        // enable areas that match current width
        $.each(rangeObject.data, function(property, item) {
          if(!item.currentActive && matchRange(item.range[0], item.range[1])) {
            // make callback
            item.currentActive = true;
            if(typeof item.enableCallback === 'function') {
              item.enableCallback();
            }
          }
        });
      });
    }
  }
  win.bind('load resize orientationchange', resizeHandler);

  // test range
  function matchRange(r1, r2) {
    var mediaQueryString = '';
    if(r1 > 0) {
      mediaQueryString += '(min-width: ' + r1 + 'px)';
    }
    if(r2 < Infinity) {
      mediaQueryString += (mediaQueryString ? ' and ' : '') + '(max-width: ' + r2 + 'px)';  
    }
    return matchQuery(mediaQueryString, r1, r2);
  }

  // media query function
  function matchQuery(query, r1, r2) {
    if(window.matchMedia && nativeMatchMedia) {
      return matchMedia(query).matches;
    } else if(window.styleMedia) {
      return styleMedia.matchMedium(query);
    } else if(window.media) {
      return media.matchMedium(query);
    } else {
      return prevWinWidth >= r1 && prevWinWidth <= r2;
    }
  }

  // range parser
  function parseRange(rangeStr) {
    var rangeData = rangeStr.split('..');
    var x1 = parseInt(rangeData[0], 10) || -Infinity;
    var x2 = parseInt(rangeData[1], 10) || Infinity;
    return [x1, x2].sort(function(a, b){
      return a - b;
    });
  }

  // export public functions
  return {
    addRange: function(ranges) {
      // parse data and add items to collection
      var result = {data:{}};
      $.each(ranges, function(property, data){
        result.data[property] = {
          range: parseRange(property),
          enableCallback: data.on,
          disableCallback: data.off
        };
      });
      handlers.push(result);

      // call resizeHandler to recalculate all events
      prevWinWidth = null;
      resizeHandler();
    }
  };
}(jQuery));


/*
 * class on scroll plugin
 */
;(function($) {
  'use strict';
  var win = jQuery(window);
  function ClassOnScroll(options) {
    this.options = $.extend({
      holder: null,
      fixedClass: 'fixed',
      compareBlock: 'div',
      blockHeight: false,
      blockTop: false,
      heightRatio: false 
    }, options);
    this.init();
  }
  ClassOnScroll.prototype = {
    init: function() {
      if (this.options.holder) {
        this.findElements();
        this.attachEvents();
      }
    },
    findElements: function() {
      this.holder = jQuery(this.options.holder);
      this.compareBlock = jQuery(this.options.compareBlock);
    },
    attachEvents: function() {
      var self = this;
      self.onScroll();
      win.bind('scroll resize orientationchange', function() { self.onScroll(); });
    },
    onScroll: function() {
      var self = this;
      if (this.options.blockHeight){
        this.scrollHeight  = this.compareBlock.innerHeight();
      }

      if (this.options.blockTop){
        this.scrollHeight  = this.compareBlock.offset().top;
      }

      if (this.options.heightRatio){
        this.scrollHeight  = this.options.heightRatio;
      }

      if (typeof this.options.addBlocks === 'string') {
        $(this.options.addBlocks).each(function(){
          self.scrollHeight += jQuery(this).outerHeight();
        });
      }

      self.scrollTop = win.scrollTop();
      if (self.scrollTop > self.scrollHeight){
        self.holder.addClass(self.options.fixedClass);
      } else {
        self.holder.removeClass(self.options.fixedClass);
      }
    },
    makeCallback: function(name) {
      if (typeof this.options[name] === 'function') {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        this.options[name].apply(this, args);
      }
    }
  };
  // jQuery plugin interface
  $.fn.classOnScroll = function(options) {
    return this.each(function() {
      var params = $.extend({}, options, {holder: this}),
        instance = new ClassOnScroll(params);
      $.data(this, 'ClassOnScroll', instance);
    });
  };

  // module exports
  window.ClassOnScroll = ClassOnScroll;
}(jQuery));

/*
 * jQuery video background plugin
 */
;(function($) {
  var win = $(window);
  var isTouchDevice = /Windows Phone/.test(navigator.userAgent) || ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;

  function VideoBG(options) {
    this.options = $.extend({
      autoPlay: true,
      activeClass: 'video-is-playing'
    }, options);
    this.init();
  }

  VideoBG.prototype = {
    init: function() {
      if (this.options.holder) {
        this.findElements();
        if (!isTouchDevice && this.video.length) {
          this.attachEvents();
          this.makeCallback('onInit', this);
        }
      }
    },
    findElements: function() {
      this.holder = $(this.options.holder);
      this.video = this.holder.find('video');
      if (isTouchDevice) {
        this.video.remove();
      }
    },
    attachEvents: function() {
      var self = this;

      this.video[0].oncanplay = function() {
        self.ratio = self.video.width() / self.video.height();
        self.resizeHandler();
        win.on('load resize orientationchange', self.resizeHandler);
      };

      this.video[0].onended = function(e) {
        self.makeCallback('onFinish', true);
      };

      this.resizeHandler = function() {
        self.ratio = self.video.width() / self.video.height();
        self.resizeVideo();
      };
      self.makeCallback('onReady', true);
    },
    resizeVideo: function() {
      var styles = this.getDimensions({
        videoRatio: this.ratio,
        maskWidth: this.holder.width(),
        maskHeight: this.holder.height()
      });

      this.video.css({
        width: styles.width,
        height: styles.height
      });
    },
    getDimensions: function(data) {
      var ratio = data.videoRatio,
        slideWidth = data.maskWidth,
        slideHeight = slideWidth / ratio;

      if (slideHeight < data.maskHeight) {
        slideHeight = data.maskHeight;
        slideWidth = slideHeight * ratio;
      }
      return {
        width: slideWidth,
        height: slideHeight
      };
    },
    makeCallback: function(name) {
      if (typeof this.options[name] === 'function') {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        this.options[name].apply(this, args);
      }
    }
  };

  $.fn.videoBG = function(opt) {
    return this.each(function() {
      $(this).data('VideoBG', new VideoBG($.extend({
        holder: this
      }, opt)));
    });
  };
}(jQuery));

/*
 * Simple Mobile Navigation
 */
 ;(function($) {
 	function MobileNav(options) {
 		this.options = $.extend({
 			container: null,
 			hideOnClickOutside: false,
 			menuActiveClass: 'nav-active',
 			menuOpener: '.nav-opener',
 			menuDrop: '.nav-drop',
 			toggleEvent: 'click',
 			outsideClickEvent: 'click touchstart pointerdown MSPointerDown'
 		}, options);
 		this.initStructure();
 		this.attachEvents();
 	}
 	MobileNav.prototype = {
 		initStructure: function() {
 			this.page = $('html');
 			this.container = $(this.options.container);
 			this.opener = this.container.find(this.options.menuOpener);
 			this.drop = this.container.find(this.options.menuDrop);
 		},
 		attachEvents: function() {
 			var self = this;

 			if(activateResizeHandler) {
 				activateResizeHandler();
 				activateResizeHandler = null;
 			}

 			this.outsideClickHandler = function(e) {
 				if(self.isOpened()) {
 					var target = $(e.target);
 					if(!target.closest(self.opener).length && !target.closest(self.drop).length) {
 						self.hide();
 					}
 				}
 			};

 			this.openerClickHandler = function(e) {
 				e.preventDefault();
 				self.toggle();
 			};

 			this.opener.on(this.options.toggleEvent, this.openerClickHandler);
 		},
 		isOpened: function() {
 			return this.container.hasClass(this.options.menuActiveClass);
 		},
 		show: function() {
 			this.container.addClass(this.options.menuActiveClass);
      if (typeof this.options.onShow === 'function') this.options.onShow(this);
 			if(this.options.hideOnClickOutside) {
 				this.page.on(this.options.outsideClickEvent, this.outsideClickHandler);
 			}
 		},
 		hide: function() {
 			this.container.removeClass(this.options.menuActiveClass);
      if (typeof this.options.onHide === 'function') this.options.onHide(this);
 			if(this.options.hideOnClickOutside) {
 				this.page.off(this.options.outsideClickEvent, this.outsideClickHandler);
 			}
 		},
 		toggle: function() {
 			if(this.isOpened()) {
 				this.hide();
 			} else {
 				this.show();
 			}
 		},
 		destroy: function() {
 			this.container.removeClass(this.options.menuActiveClass);
 			this.opener.off(this.options.toggleEvent, this.clickHandler);
 			this.page.off(this.options.outsideClickEvent, this.outsideClickHandler);
 		}
 	};

 	var activateResizeHandler = function() {
 		var win = $(window),
 		doc = $('html'),
 		resizeClass = 'resize-active',
 		flag, timer;
 		var removeClassHandler = function() {
 			flag = false;
 			doc.removeClass(resizeClass);
 		};
 		var resizeHandler = function() {
 			if(!flag) {
 				flag = true;
 				doc.addClass(resizeClass);
 			}
 			clearTimeout(timer);
 			timer = setTimeout(removeClassHandler, 500);
 		};
 		win.on('resize orientationchange', resizeHandler);
 	};

 	$.fn.mobileNav = function(options) {
 		return this.each(function() {
 			var params = $.extend({}, options, {container: this}),
 			instance = new MobileNav(params);
 			$.data(this, 'MobileNav', instance);
 		});
 	};
 }(jQuery));

 // navigation accesibility module
function TouchNav(opt) {
  this.options = {
    hoverClass: 'hover',
    menuItems: 'li',
    menuOpener: 'a',
    menuDrop: 'ul',
    navBlock: null
  };
  for(var p in opt) {
    if(opt.hasOwnProperty(p)) {
      this.options[p] = opt[p];
    }
  }
  this.init();
}
TouchNav.isActiveOn = function(elem) {
  return elem && elem.touchNavActive;
};
TouchNav.prototype = {
  init: function() {
    if(typeof this.options.navBlock === 'string') {
      this.menu = document.getElementById(this.options.navBlock);
    } else if(typeof this.options.navBlock === 'object') {
      this.menu = this.options.navBlock;
    }
    if(this.menu) {
      this.addEvents();
    }
  },
  addEvents: function() {
    // attach event handlers
    var self = this;
    var touchEvent = (navigator.pointerEnabled && 'pointerdown') || (navigator.msPointerEnabled && 'MSPointerDown') || (this.isTouchDevice && 'touchstart');
    this.menuItems = lib.queryElementsBySelector(this.options.menuItems, this.menu);

    var initMenuItem = function(item) {
      var currentDrop = lib.queryElementsBySelector(self.options.menuDrop, item)[0],
        currentOpener = lib.queryElementsBySelector(self.options.menuOpener, item)[0];

      // only for touch input devices
      if( currentDrop && currentOpener && (self.isTouchDevice || self.isPointerDevice) ) {
        lib.event.add(currentOpener, 'click', lib.bind(self.clickHandler, self));
        lib.event.add(currentOpener, 'mousedown', lib.bind(self.mousedownHandler, self));
        lib.event.add(currentOpener, touchEvent, function(e){
          if( !self.isTouchPointerEvent(e) ) {
            self.preventCurrentClick = false;
            return;
          }
          self.touchFlag = true;
          self.currentItem = item;
          self.currentLink = currentOpener;
          self.pressHandler.apply(self, arguments);
        });
      }
      // for desktop computers and touch devices
      jQuery(item).bind('mouseenter', function(){
        if(!self.touchFlag) {
          self.currentItem = item;
          self.mouseoverHandler();
        }
      });
      jQuery(item).bind('mouseleave', function(){
        if(!self.touchFlag) {
          self.currentItem = item;
          self.mouseoutHandler();
        }
      });
      item.touchNavActive = true;
    };

    // addd handlers for all menu items
    for(var i = 0; i < this.menuItems.length; i++) {
      initMenuItem(self.menuItems[i]);
    }

    // hide dropdowns when clicking outside navigation
    if(this.isTouchDevice || this.isPointerDevice) {
      lib.event.add(document.documentElement, 'mousedown', lib.bind(this.clickOutsideHandler, this));
      lib.event.add(document.documentElement, touchEvent, lib.bind(this.clickOutsideHandler, this));
    }
  },
  mousedownHandler: function(e) {
    if(this.touchFlag) {
      e.preventDefault();
      this.touchFlag = false;
      this.preventCurrentClick = false;
    }
  },
  mouseoverHandler: function() {
    lib.addClass(this.currentItem, this.options.hoverClass);
    jQuery(this.currentItem).trigger('itemhover');
  },
  mouseoutHandler: function() {
    lib.removeClass(this.currentItem, this.options.hoverClass);
    jQuery(this.currentItem).trigger('itemleave');
  },
  hideActiveDropdown: function() {
    for(var i = 0; i < this.menuItems.length; i++) {
      if(lib.hasClass(this.menuItems[i], this.options.hoverClass)) {
        lib.removeClass(this.menuItems[i], this.options.hoverClass);
        jQuery(this.menuItems[i]).trigger('itemleave');
      }
    }
    this.activeParent = null;
  },
  pressHandler: function(e) {
    // hide previous drop (if active)
    if(this.currentItem !== this.activeParent) {
      if(this.activeParent && this.currentItem.parentNode === this.activeParent.parentNode) {
        lib.removeClass(this.activeParent, this.options.hoverClass);
      } else if(!this.isParent(this.activeParent, this.currentLink)) {
        this.hideActiveDropdown();
      }
    }
    // handle current drop
    this.activeParent = this.currentItem;
    if(lib.hasClass(this.currentItem, this.options.hoverClass)) {
      this.preventCurrentClick = false;
    } else {
      e.preventDefault();
      this.preventCurrentClick = true;
      lib.addClass(this.currentItem, this.options.hoverClass);
      jQuery(this.currentItem).trigger('itemhover');
    }
  },
  clickHandler: function(e) {
    // prevent first click on link
    if(this.preventCurrentClick) {
      e.preventDefault();
    }
  },
  clickOutsideHandler: function(event) {
    var e = event.changedTouches ? event.changedTouches[0] : event;
    if(this.activeParent && !this.isParent(this.menu, e.target)) {
      this.hideActiveDropdown();
      this.touchFlag = false;
    }
  },
  isParent: function(parent, child) {
    while(child.parentNode) {
      if(child.parentNode == parent) {
        return true;
      }
      child = child.parentNode;
    }
    return false;
  },
  isTouchPointerEvent: function(e) {
    return (e.type.indexOf('touch') > -1) ||
        (navigator.pointerEnabled && e.pointerType === 'touch') ||
        (navigator.msPointerEnabled && e.pointerType == e.MSPOINTER_TYPE_TOUCH);
  },
  isPointerDevice: (function() {
    return !!(navigator.pointerEnabled || navigator.msPointerEnabled);
  }()),
  isTouchDevice: (function() {
    return !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
  }())
};

/*
 * Utility module
 */
lib = {
  hasClass: function(el,cls) {
    return el && el.className ? el.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)')) : false;
  },
  addClass: function(el,cls) {
    if (el && !this.hasClass(el,cls)) el.className += " "+cls;
  },
  removeClass: function(el,cls) {
    if (el && this.hasClass(el,cls)) {el.className=el.className.replace(new RegExp('(\\s|^)'+cls+'(\\s|$)'),' ');}
  },
  extend: function(obj) {
    for(var i = 1; i < arguments.length; i++) {
      for(var p in arguments[i]) {
        if(arguments[i].hasOwnProperty(p)) {
          obj[p] = arguments[i][p];
        }
      }
    }
    return obj;
  },
  each: function(obj, callback) {
    var property, len;
    if(typeof obj.length === 'number') {
      for(property = 0, len = obj.length; property < len; property++) {
        if(callback.call(obj[property], property, obj[property]) === false) {
          break;
        }
      }
    } else {
      for(property in obj) {
        if(obj.hasOwnProperty(property)) {
          if(callback.call(obj[property], property, obj[property]) === false) {
            break;
          }
        }
      }
    }
  },
  event: (function() {
    var fixEvent = function(e) {
      e = e || window.event;
      if(e.isFixed) return e; else e.isFixed = true;
      if(!e.target) e.target = e.srcElement;
      e.preventDefault = e.preventDefault || function() {this.returnValue = false;};
      e.stopPropagation = e.stopPropagation || function() {this.cancelBubble = true;};
      return e;
    };
    return {
      add: function(elem, event, handler) {
        if(!elem.events) {
          elem.events = {};
          elem.handle = function(e) {
            var ret, handlers = elem.events[e.type];
            e = fixEvent(e);
            for(var i = 0, len = handlers.length; i < len; i++) {
              if(handlers[i]) {
                ret = handlers[i].call(elem, e);
                if(ret === false) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }
            }
          };
        }
        if(!elem.events[event]) {
          elem.events[event] = [];
          if(elem.addEventListener) elem.addEventListener(event, elem.handle, false);
          else if(elem.attachEvent) elem.attachEvent('on'+event, elem.handle);
        }
        elem.events[event].push(handler);
      },
      remove: function(elem, event, handler) {
        var handlers = elem.events[event];
        for(var i = handlers.length - 1; i >= 0; i--) {
          if(handlers[i] === handler) {
            handlers.splice(i,1);
          }
        }
        if(!handlers.length) {
          delete elem.events[event];
          if(elem.removeEventListener) elem.removeEventListener(event, elem.handle, false);
          else if(elem.detachEvent) elem.detachEvent('on'+event, elem.handle);
        }
      }
    };
  }()),
  queryElementsBySelector: function(selector, scope) {
    scope = scope || document;
    if(!selector) return [];
    if(selector === '>*') return scope.children;
    if(typeof document.querySelectorAll === 'function') {
      return scope.querySelectorAll(selector);
    }
    var selectors = selector.split(',');
    var resultList = [];
    for(var s = 0; s < selectors.length; s++) {
      var currentContext = [scope || document];
      var tokens = selectors[s].replace(/^\s+/,'').replace(/\s+$/,'').split(' ');
      for (var i = 0; i < tokens.length; i++) {
        token = tokens[i].replace(/^\s+/,'').replace(/\s+$/,'');
        if (token.indexOf('#') > -1) {
          var bits = token.split('#'), tagName = bits[0], id = bits[1];
          var element = document.getElementById(id);
          if (element && tagName && element.nodeName.toLowerCase() != tagName) {
            return [];
          }
          currentContext = element ? [element] : [];
          continue;
        }
        if (token.indexOf('.') > -1) {
          var bits = token.split('.'), tagName = bits[0] || '*', className = bits[1], found = [], foundCount = 0;
          for (var h = 0; h < currentContext.length; h++) {
            var elements;
            if (tagName == '*') {
              elements = currentContext[h].getElementsByTagName('*');
            } else {
              elements = currentContext[h].getElementsByTagName(tagName);
            }
            for (var j = 0; j < elements.length; j++) {
              found[foundCount++] = elements[j];
            }
          }
          currentContext = [];
          var currentContextIndex = 0;
          for (var k = 0; k < found.length; k++) {
            if (found[k].className && found[k].className.match(new RegExp('(\\s|^)'+className+'(\\s|$)'))) {
              currentContext[currentContextIndex++] = found[k];
            }
          }
          continue;
        }
        if (token.match(/^(\w*)\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"]*)"?\]$/)) {
          var tagName = RegExp.$1 || '*', attrName = RegExp.$2, attrOperator = RegExp.$3, attrValue = RegExp.$4;
          if(attrName.toLowerCase() == 'for' && this.browser.msie && this.browser.version < 8) {
            attrName = 'htmlFor';
          }
          var found = [], foundCount = 0;
          for (var h = 0; h < currentContext.length; h++) {
            var elements;
            if (tagName == '*') {
              elements = currentContext[h].getElementsByTagName('*');
            } else {
              elements = currentContext[h].getElementsByTagName(tagName);
            }
            for (var j = 0; elements[j]; j++) {
              found[foundCount++] = elements[j];
            }
          }
          currentContext = [];
          var currentContextIndex = 0, checkFunction;
          switch (attrOperator) {
            case '=': checkFunction = function(e) { return (e.getAttribute(attrName) == attrValue) }; break;
            case '~': checkFunction = function(e) { return (e.getAttribute(attrName).match(new RegExp('(\\s|^)'+attrValue+'(\\s|$)'))) }; break;
            case '|': checkFunction = function(e) { return (e.getAttribute(attrName).match(new RegExp('^'+attrValue+'-?'))) }; break;
            case '^': checkFunction = function(e) { return (e.getAttribute(attrName).indexOf(attrValue) == 0) }; break;
            case '$': checkFunction = function(e) { return (e.getAttribute(attrName).lastIndexOf(attrValue) == e.getAttribute(attrName).length - attrValue.length) }; break;
            case '*': checkFunction = function(e) { return (e.getAttribute(attrName).indexOf(attrValue) > -1) }; break;
            default : checkFunction = function(e) { return e.getAttribute(attrName) };
          }
          currentContext = [];
          var currentContextIndex = 0;
          for (var k = 0; k < found.length; k++) {
            if (checkFunction(found[k])) {
              currentContext[currentContextIndex++] = found[k];
            }
          }
          continue;
        }
        tagName = token;
        var found = [], foundCount = 0;
        for (var h = 0; h < currentContext.length; h++) {
          var elements = currentContext[h].getElementsByTagName(tagName);
          for (var j = 0; j < elements.length; j++) {
            found[foundCount++] = elements[j];
          }
        }
        currentContext = found;
      }
      resultList = [].concat(resultList,currentContext);
    }
    return resultList;
  },
  trim: function (str) {
    return str.replace(/^\s+/, '').replace(/\s+$/, '');
  },
  bind: function(f, scope, forceArgs){
    return function() {return f.apply(scope, typeof forceArgs !== 'undefined' ? [forceArgs] : arguments);};
  }
};


/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.12
 *
 * Requires: jQuery 1.2.2+
 */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof exports?module.exports=a:a(jQuery)}(function(a){function b(b){var g=b||window.event,h=i.call(arguments,1),j=0,l=0,m=0,n=0,o=0,p=0;if(b=a.event.fix(g),b.type="mousewheel","detail"in g&&(m=-1*g.detail),"wheelDelta"in g&&(m=g.wheelDelta),"wheelDeltaY"in g&&(m=g.wheelDeltaY),"wheelDeltaX"in g&&(l=-1*g.wheelDeltaX),"axis"in g&&g.axis===g.HORIZONTAL_AXIS&&(l=-1*m,m=0),j=0===m?l:m,"deltaY"in g&&(m=-1*g.deltaY,j=m),"deltaX"in g&&(l=g.deltaX,0===m&&(j=-1*l)),0!==m||0!==l){if(1===g.deltaMode){var q=a.data(this,"mousewheel-line-height");j*=q,m*=q,l*=q}else if(2===g.deltaMode){var r=a.data(this,"mousewheel-page-height");j*=r,m*=r,l*=r}if(n=Math.max(Math.abs(m),Math.abs(l)),(!f||f>n)&&(f=n,d(g,n)&&(f/=40)),d(g,n)&&(j/=40,l/=40,m/=40),j=Math[j>=1?"floor":"ceil"](j/f),l=Math[l>=1?"floor":"ceil"](l/f),m=Math[m>=1?"floor":"ceil"](m/f),k.settings.normalizeOffset&&this.getBoundingClientRect){var s=this.getBoundingClientRect();o=b.clientX-s.left,p=b.clientY-s.top}return b.deltaX=l,b.deltaY=m,b.deltaFactor=f,b.offsetX=o,b.offsetY=p,b.deltaMode=0,h.unshift(b,j,l,m),e&&clearTimeout(e),e=setTimeout(c,200),(a.event.dispatch||a.event.handle).apply(this,h)}}function c(){f=null}function d(a,b){return k.settings.adjustOldDeltas&&"mousewheel"===a.type&&b%120===0}var e,f,g=["wheel","mousewheel","DOMMouseScroll","MozMousePixelScroll"],h="onwheel"in document||document.documentMode>=9?["wheel"]:["mousewheel","DomMouseScroll","MozMousePixelScroll"],i=Array.prototype.slice;if(a.event.fixHooks)for(var j=g.length;j;)a.event.fixHooks[g[--j]]=a.event.mouseHooks;var k=a.event.special.mousewheel={version:"3.1.12",setup:function(){if(this.addEventListener)for(var c=h.length;c;)this.addEventListener(h[--c],b,!1);else this.onmousewheel=b;a.data(this,"mousewheel-line-height",k.getLineHeight(this)),a.data(this,"mousewheel-page-height",k.getPageHeight(this))},teardown:function(){if(this.removeEventListener)for(var c=h.length;c;)this.removeEventListener(h[--c],b,!1);else this.onmousewheel=null;a.removeData(this,"mousewheel-line-height"),a.removeData(this,"mousewheel-page-height")},getLineHeight:function(b){var c=a(b),d=c["offsetParent"in a.fn?"offsetParent":"parent"]();return d.length||(d=a("body")),parseInt(d.css("fontSize"),10)||parseInt(c.css("fontSize"),10)||16},getPageHeight:function(b){return a(b).height()},settings:{adjustOldDeltas:!0,normalizeOffset:!0}};a.fn.extend({mousewheel:function(a){return a?this.bind("mousewheel",a):this.trigger("mousewheel")},unmousewheel:function(a){return this.unbind("mousewheel",a)}})});


/* jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/ */
jQuery.easing.jswing=jQuery.easing.swing;jQuery.extend(jQuery.easing,{def:"easeOutQuad",swing:function(e,f,a,h,g){return jQuery.easing[jQuery.easing.def](e,f,a,h,g)},easeInQuad:function(e,f,a,h,g){return h*(f/=g)*f+a},easeOutQuad:function(e,f,a,h,g){return -h*(f/=g)*(f-2)+a},easeInOutQuad:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f+a}return -h/2*((--f)*(f-2)-1)+a},easeInCubic:function(e,f,a,h,g){return h*(f/=g)*f*f+a},easeOutCubic:function(e,f,a,h,g){return h*((f=f/g-1)*f*f+1)+a},easeInOutCubic:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f*f+a}return h/2*((f-=2)*f*f+2)+a},easeInQuart:function(e,f,a,h,g){return h*(f/=g)*f*f*f+a},easeOutQuart:function(e,f,a,h,g){return -h*((f=f/g-1)*f*f*f-1)+a},easeInOutQuart:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f*f*f+a}return -h/2*((f-=2)*f*f*f-2)+a},easeInQuint:function(e,f,a,h,g){return h*(f/=g)*f*f*f*f+a},easeOutQuint:function(e,f,a,h,g){return h*((f=f/g-1)*f*f*f*f+1)+a},easeInOutQuint:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f*f*f*f+a}return h/2*((f-=2)*f*f*f*f+2)+a},easeInSine:function(e,f,a,h,g){return -h*Math.cos(f/g*(Math.PI/2))+h+a},easeOutSine:function(e,f,a,h,g){return h*Math.sin(f/g*(Math.PI/2))+a},easeInOutSine:function(e,f,a,h,g){return -h/2*(Math.cos(Math.PI*f/g)-1)+a},easeInExpo:function(e,f,a,h,g){return(f==0)?a:h*Math.pow(2,10*(f/g-1))+a},easeOutExpo:function(e,f,a,h,g){return(f==g)?a+h:h*(-Math.pow(2,-10*f/g)+1)+a},easeInOutExpo:function(e,f,a,h,g){if(f==0){return a}if(f==g){return a+h}if((f/=g/2)<1){return h/2*Math.pow(2,10*(f-1))+a}return h/2*(-Math.pow(2,-10*--f)+2)+a},easeInCirc:function(e,f,a,h,g){return -h*(Math.sqrt(1-(f/=g)*f)-1)+a},easeOutCirc:function(e,f,a,h,g){return h*Math.sqrt(1-(f=f/g-1)*f)+a},easeInOutCirc:function(e,f,a,h,g){if((f/=g/2)<1){return -h/2*(Math.sqrt(1-f*f)-1)+a}return h/2*(Math.sqrt(1-(f-=2)*f)+1)+a},easeInElastic:function(f,h,e,l,k){var i=1.70158;var j=0;var g=l;if(h==0){return e}if((h/=k)==1){return e+l}if(!j){j=k*0.3}if(g<Math.abs(l)){g=l;var i=j/4}else{var i=j/(2*Math.PI)*Math.asin(l/g)}return -(g*Math.pow(2,10*(h-=1))*Math.sin((h*k-i)*(2*Math.PI)/j))+e},easeOutElastic:function(f,h,e,l,k){var i=1.70158;var j=0;var g=l;if(h==0){return e}if((h/=k)==1){return e+l}if(!j){j=k*0.3}if(g<Math.abs(l)){g=l;var i=j/4}else{var i=j/(2*Math.PI)*Math.asin(l/g)}return g*Math.pow(2,-10*h)*Math.sin((h*k-i)*(2*Math.PI)/j)+l+e},easeInOutElastic:function(f,h,e,l,k){var i=1.70158;var j=0;var g=l;if(h==0){return e}if((h/=k/2)==2){return e+l}if(!j){j=k*(0.3*1.5)}if(g<Math.abs(l)){g=l;var i=j/4}else{var i=j/(2*Math.PI)*Math.asin(l/g)}if(h<1){return -0.5*(g*Math.pow(2,10*(h-=1))*Math.sin((h*k-i)*(2*Math.PI)/j))+e}return g*Math.pow(2,-10*(h-=1))*Math.sin((h*k-i)*(2*Math.PI)/j)*0.5+l+e},easeInBack:function(e,f,a,i,h,g){if(g==undefined){g=1.70158}return i*(f/=h)*f*((g+1)*f-g)+a},easeOutBack:function(e,f,a,i,h,g){if(g==undefined){g=1.70158}return i*((f=f/h-1)*f*((g+1)*f+g)+1)+a},easeInOutBack:function(e,f,a,i,h,g){if(g==undefined){g=1.70158}if((f/=h/2)<1){return i/2*(f*f*(((g*=(1.525))+1)*f-g))+a}return i/2*((f-=2)*f*(((g*=(1.525))+1)*f+g)+2)+a},easeInBounce:function(e,f,a,h,g){return h-jQuery.easing.easeOutBounce(e,g-f,0,h,g)+a},easeOutBounce:function(e,f,a,h,g){if((f/=g)<(1/2.75)){return h*(7.5625*f*f)+a}else{if(f<(2/2.75)){return h*(7.5625*(f-=(1.5/2.75))*f+0.75)+a}else{if(f<(2.5/2.75)){return h*(7.5625*(f-=(2.25/2.75))*f+0.9375)+a}else{return h*(7.5625*(f-=(2.625/2.75))*f+0.984375)+a}}}},easeInOutBounce:function(e,f,a,h,g){if(f<g/2){return jQuery.easing.easeInBounce(e,f*2,0,h,g)*0.5+a}return jQuery.easing.easeOutBounce(e,f*2-g,0,h,g)*0.5+h*0.5+a}});


/*! Hammer.JS - v2.0.4 - 2014-09-28
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2014 Jorik Tangelder;
 * Licensed under the MIT license */
if(Object.create){!function(a,b,c,d){"use strict";function e(a,b,c){return setTimeout(k(a,c),b)}function f(a,b,c){return Array.isArray(a)?(g(a,c[b],c),!0):!1}function g(a,b,c){var e;if(a)if(a.forEach)a.forEach(b,c);else if(a.length!==d)for(e=0;e<a.length;)b.call(c,a[e],e,a),e++;else for(e in a)a.hasOwnProperty(e)&&b.call(c,a[e],e,a)}function h(a,b,c){for(var e=Object.keys(b),f=0;f<e.length;)(!c||c&&a[e[f]]===d)&&(a[e[f]]=b[e[f]]),f++;return a}function i(a,b){return h(a,b,!0)}function j(a,b,c){var d,e=b.prototype;d=a.prototype=Object.create(e),d.constructor=a,d._super=e,c&&h(d,c)}function k(a,b){return function(){return a.apply(b,arguments)}}function l(a,b){return typeof a==kb?a.apply(b?b[0]||d:d,b):a}function m(a,b){return a===d?b:a}function n(a,b,c){g(r(b),function(b){a.addEventListener(b,c,!1)})}function o(a,b,c){g(r(b),function(b){a.removeEventListener(b,c,!1)})}function p(a,b){for(;a;){if(a==b)return!0;a=a.parentNode}return!1}function q(a,b){return a.indexOf(b)>-1}function r(a){return a.trim().split(/\s+/g)}function s(a,b,c){if(a.indexOf&&!c)return a.indexOf(b);for(var d=0;d<a.length;){if(c&&a[d][c]==b||!c&&a[d]===b)return d;d++}return-1}function t(a){return Array.prototype.slice.call(a,0)}function u(a,b,c){for(var d=[],e=[],f=0;f<a.length;){var g=b?a[f][b]:a[f];s(e,g)<0&&d.push(a[f]),e[f]=g,f++}return c&&(d=b?d.sort(function(a,c){return a[b]>c[b]}):d.sort()),d}function v(a,b){for(var c,e,f=b[0].toUpperCase()+b.slice(1),g=0;g<ib.length;){if(c=ib[g],e=c?c+f:b,e in a)return e;g++}return d}function w(){return ob++}function x(a){var b=a.ownerDocument;return b.defaultView||b.parentWindow}function y(a,b){var c=this;this.manager=a,this.callback=b,this.element=a.element,this.target=a.options.inputTarget,this.domHandler=function(b){l(a.options.enable,[a])&&c.handler(b)},this.init()}function z(a){var b,c=a.options.inputClass;return new(b=c?c:rb?N:sb?Q:qb?S:M)(a,A)}function A(a,b,c){var d=c.pointers.length,e=c.changedPointers.length,f=b&yb&&d-e===0,g=b&(Ab|Bb)&&d-e===0;c.isFirst=!!f,c.isFinal=!!g,f&&(a.session={}),c.eventType=b,B(a,c),a.emit("hammer.input",c),a.recognize(c),a.session.prevInput=c}function B(a,b){var c=a.session,d=b.pointers,e=d.length;c.firstInput||(c.firstInput=E(b)),e>1&&!c.firstMultiple?c.firstMultiple=E(b):1===e&&(c.firstMultiple=!1);var f=c.firstInput,g=c.firstMultiple,h=g?g.center:f.center,i=b.center=F(d);b.timeStamp=nb(),b.deltaTime=b.timeStamp-f.timeStamp,b.angle=J(h,i),b.distance=I(h,i),C(c,b),b.offsetDirection=H(b.deltaX,b.deltaY),b.scale=g?L(g.pointers,d):1,b.rotation=g?K(g.pointers,d):0,D(c,b);var j=a.element;p(b.srcEvent.target,j)&&(j=b.srcEvent.target),b.target=j}function C(a,b){var c=b.center,d=a.offsetDelta||{},e=a.prevDelta||{},f=a.prevInput||{};(b.eventType===yb||f.eventType===Ab)&&(e=a.prevDelta={x:f.deltaX||0,y:f.deltaY||0},d=a.offsetDelta={x:c.x,y:c.y}),b.deltaX=e.x+(c.x-d.x),b.deltaY=e.y+(c.y-d.y)}function D(a,b){var c,e,f,g,h=a.lastInterval||b,i=b.timeStamp-h.timeStamp;if(b.eventType!=Bb&&(i>xb||h.velocity===d)){var j=h.deltaX-b.deltaX,k=h.deltaY-b.deltaY,l=G(i,j,k);e=l.x,f=l.y,c=mb(l.x)>mb(l.y)?l.x:l.y,g=H(j,k),a.lastInterval=b}else c=h.velocity,e=h.velocityX,f=h.velocityY,g=h.direction;b.velocity=c,b.velocityX=e,b.velocityY=f,b.direction=g}function E(a){for(var b=[],c=0;c<a.pointers.length;)b[c]={clientX:lb(a.pointers[c].clientX),clientY:lb(a.pointers[c].clientY)},c++;return{timeStamp:nb(),pointers:b,center:F(b),deltaX:a.deltaX,deltaY:a.deltaY}}function F(a){var b=a.length;if(1===b)return{x:lb(a[0].clientX),y:lb(a[0].clientY)};for(var c=0,d=0,e=0;b>e;)c+=a[e].clientX,d+=a[e].clientY,e++;return{x:lb(c/b),y:lb(d/b)}}function G(a,b,c){return{x:b/a||0,y:c/a||0}}function H(a,b){return a===b?Cb:mb(a)>=mb(b)?a>0?Db:Eb:b>0?Fb:Gb}function I(a,b,c){c||(c=Kb);var d=b[c[0]]-a[c[0]],e=b[c[1]]-a[c[1]];return Math.sqrt(d*d+e*e)}function J(a,b,c){c||(c=Kb);var d=b[c[0]]-a[c[0]],e=b[c[1]]-a[c[1]];return 180*Math.atan2(e,d)/Math.PI}function K(a,b){return J(b[1],b[0],Lb)-J(a[1],a[0],Lb)}function L(a,b){return I(b[0],b[1],Lb)/I(a[0],a[1],Lb)}function M(){this.evEl=Nb,this.evWin=Ob,this.allow=!0,this.pressed=!1,y.apply(this,arguments)}function N(){this.evEl=Rb,this.evWin=Sb,y.apply(this,arguments),this.store=this.manager.session.pointerEvents=[]}function O(){this.evTarget=Ub,this.evWin=Vb,this.started=!1,y.apply(this,arguments)}function P(a,b){var c=t(a.touches),d=t(a.changedTouches);return b&(Ab|Bb)&&(c=u(c.concat(d),"identifier",!0)),[c,d]}function Q(){this.evTarget=Xb,this.targetIds={},y.apply(this,arguments)}function R(a,b){var c=t(a.touches),d=this.targetIds;if(b&(yb|zb)&&1===c.length)return d[c[0].identifier]=!0,[c,c];var e,f,g=t(a.changedTouches),h=[],i=this.target;if(f=c.filter(function(a){return p(a.target,i)}),b===yb)for(e=0;e<f.length;)d[f[e].identifier]=!0,e++;for(e=0;e<g.length;)d[g[e].identifier]&&h.push(g[e]),b&(Ab|Bb)&&delete d[g[e].identifier],e++;return h.length?[u(f.concat(h),"identifier",!0),h]:void 0}function S(){y.apply(this,arguments);var a=k(this.handler,this);this.touch=new Q(this.manager,a),this.mouse=new M(this.manager,a)}function T(a,b){this.manager=a,this.set(b)}function U(a){if(q(a,bc))return bc;var b=q(a,cc),c=q(a,dc);return b&&c?cc+" "+dc:b||c?b?cc:dc:q(a,ac)?ac:_b}function V(a){this.id=w(),this.manager=null,this.options=i(a||{},this.defaults),this.options.enable=m(this.options.enable,!0),this.state=ec,this.simultaneous={},this.requireFail=[]}function W(a){return a&jc?"cancel":a&hc?"end":a&gc?"move":a&fc?"start":""}function X(a){return a==Gb?"down":a==Fb?"up":a==Db?"left":a==Eb?"right":""}function Y(a,b){var c=b.manager;return c?c.get(a):a}function Z(){V.apply(this,arguments)}function $(){Z.apply(this,arguments),this.pX=null,this.pY=null}function _(){Z.apply(this,arguments)}function ab(){V.apply(this,arguments),this._timer=null,this._input=null}function bb(){Z.apply(this,arguments)}function cb(){Z.apply(this,arguments)}function db(){V.apply(this,arguments),this.pTime=!1,this.pCenter=!1,this._timer=null,this._input=null,this.count=0}function eb(a,b){return b=b||{},b.recognizers=m(b.recognizers,eb.defaults.preset),new fb(a,b)}function fb(a,b){b=b||{},this.options=i(b,eb.defaults),this.options.inputTarget=this.options.inputTarget||a,this.handlers={},this.session={},this.recognizers=[],this.element=a,this.input=z(this),this.touchAction=new T(this,this.options.touchAction),gb(this,!0),g(b.recognizers,function(a){var b=this.add(new a[0](a[1]));a[2]&&b.recognizeWith(a[2]),a[3]&&b.requireFailure(a[3])},this)}function gb(a,b){var c=a.element;g(a.options.cssProps,function(a,d){c.style[v(c.style,d)]=b?a:""})}function hb(a,c){var d=b.createEvent("Event");d.initEvent(a,!0,!0),d.gesture=c,c.target.dispatchEvent(d)}var ib=["","webkit","moz","MS","ms","o"],jb=b.createElement("div"),kb="function",lb=Math.round,mb=Math.abs,nb=Date.now,ob=1,pb=/mobile|tablet|ip(ad|hone|od)|android/i,qb="ontouchstart"in a,rb=v(a,"PointerEvent")!==d,sb=qb&&pb.test(navigator.userAgent),tb="touch",ub="pen",vb="mouse",wb="kinect",xb=25,yb=1,zb=2,Ab=4,Bb=8,Cb=1,Db=2,Eb=4,Fb=8,Gb=16,Hb=Db|Eb,Ib=Fb|Gb,Jb=Hb|Ib,Kb=["x","y"],Lb=["clientX","clientY"];y.prototype={handler:function(){},init:function(){this.evEl&&n(this.element,this.evEl,this.domHandler),this.evTarget&&n(this.target,this.evTarget,this.domHandler),this.evWin&&n(x(this.element),this.evWin,this.domHandler)},destroy:function(){this.evEl&&o(this.element,this.evEl,this.domHandler),this.evTarget&&o(this.target,this.evTarget,this.domHandler),this.evWin&&o(x(this.element),this.evWin,this.domHandler)}};var Mb={mousedown:yb,mousemove:zb,mouseup:Ab},Nb="mousedown",Ob="mousemove mouseup";j(M,y,{handler:function(a){var b=Mb[a.type];b&yb&&0===a.button&&(this.pressed=!0),b&zb&&1!==a.which&&(b=Ab),this.pressed&&this.allow&&(b&Ab&&(this.pressed=!1),this.callback(this.manager,b,{pointers:[a],changedPointers:[a],pointerType:vb,srcEvent:a}))}});var Pb={pointerdown:yb,pointermove:zb,pointerup:Ab,pointercancel:Bb,pointerout:Bb},Qb={2:tb,3:ub,4:vb,5:wb},Rb="pointerdown",Sb="pointermove pointerup pointercancel";a.MSPointerEvent&&(Rb="MSPointerDown",Sb="MSPointerMove MSPointerUp MSPointerCancel"),j(N,y,{handler:function(a){var b=this.store,c=!1,d=a.type.toLowerCase().replace("ms",""),e=Pb[d],f=Qb[a.pointerType]||a.pointerType,g=f==tb,h=s(b,a.pointerId,"pointerId");e&yb&&(0===a.button||g)?0>h&&(b.push(a),h=b.length-1):e&(Ab|Bb)&&(c=!0),0>h||(b[h]=a,this.callback(this.manager,e,{pointers:b,changedPointers:[a],pointerType:f,srcEvent:a}),c&&b.splice(h,1))}});var Tb={touchstart:yb,touchmove:zb,touchend:Ab,touchcancel:Bb},Ub="touchstart",Vb="touchstart touchmove touchend touchcancel";j(O,y,{handler:function(a){var b=Tb[a.type];if(b===yb&&(this.started=!0),this.started){var c=P.call(this,a,b);b&(Ab|Bb)&&c[0].length-c[1].length===0&&(this.started=!1),this.callback(this.manager,b,{pointers:c[0],changedPointers:c[1],pointerType:tb,srcEvent:a})}}});var Wb={touchstart:yb,touchmove:zb,touchend:Ab,touchcancel:Bb},Xb="touchstart touchmove touchend touchcancel";j(Q,y,{handler:function(a){var b=Wb[a.type],c=R.call(this,a,b);c&&this.callback(this.manager,b,{pointers:c[0],changedPointers:c[1],pointerType:tb,srcEvent:a})}}),j(S,y,{handler:function(a,b,c){var d=c.pointerType==tb,e=c.pointerType==vb;if(d)this.mouse.allow=!1;else if(e&&!this.mouse.allow)return;b&(Ab|Bb)&&(this.mouse.allow=!0),this.callback(a,b,c)},destroy:function(){this.touch.destroy(),this.mouse.destroy()}});var Yb=v(jb.style,"touchAction"),Zb=Yb!==d,$b="compute",_b="auto",ac="manipulation",bc="none",cc="pan-x",dc="pan-y";T.prototype={set:function(a){a==$b&&(a=this.compute()),Zb&&(this.manager.element.style[Yb]=a),this.actions=a.toLowerCase().trim()},update:function(){this.set(this.manager.options.touchAction)},compute:function(){var a=[];return g(this.manager.recognizers,function(b){l(b.options.enable,[b])&&(a=a.concat(b.getTouchAction()))}),U(a.join(" "))},preventDefaults:function(a){if(!Zb){var b=a.srcEvent,c=a.offsetDirection;if(this.manager.session.prevented)return void b.preventDefault();var d=this.actions,e=q(d,bc),f=q(d,dc),g=q(d,cc);return e||f&&c&Hb||g&&c&Ib?this.preventSrc(b):void 0}},preventSrc:function(a){this.manager.session.prevented=!0,a.preventDefault()}};var ec=1,fc=2,gc=4,hc=8,ic=hc,jc=16,kc=32;V.prototype={defaults:{},set:function(a){return h(this.options,a),this.manager&&this.manager.touchAction.update(),this},recognizeWith:function(a){if(f(a,"recognizeWith",this))return this;var b=this.simultaneous;return a=Y(a,this),b[a.id]||(b[a.id]=a,a.recognizeWith(this)),this},dropRecognizeWith:function(a){return f(a,"dropRecognizeWith",this)?this:(a=Y(a,this),delete this.simultaneous[a.id],this)},requireFailure:function(a){if(f(a,"requireFailure",this))return this;var b=this.requireFail;return a=Y(a,this),-1===s(b,a)&&(b.push(a),a.requireFailure(this)),this},dropRequireFailure:function(a){if(f(a,"dropRequireFailure",this))return this;a=Y(a,this);var b=s(this.requireFail,a);return b>-1&&this.requireFail.splice(b,1),this},hasRequireFailures:function(){return this.requireFail.length>0},canRecognizeWith:function(a){return!!this.simultaneous[a.id]},emit:function(a){function b(b){c.manager.emit(c.options.event+(b?W(d):""),a)}var c=this,d=this.state;hc>d&&b(!0),b(),d>=hc&&b(!0)},tryEmit:function(a){return this.canEmit()?this.emit(a):void(this.state=kc)},canEmit:function(){for(var a=0;a<this.requireFail.length;){if(!(this.requireFail[a].state&(kc|ec)))return!1;a++}return!0},recognize:function(a){var b=h({},a);return l(this.options.enable,[this,b])?(this.state&(ic|jc|kc)&&(this.state=ec),this.state=this.process(b),void(this.state&(fc|gc|hc|jc)&&this.tryEmit(b))):(this.reset(),void(this.state=kc))},process:function(){},getTouchAction:function(){},reset:function(){}},j(Z,V,{defaults:{pointers:1},attrTest:function(a){var b=this.options.pointers;return 0===b||a.pointers.length===b},process:function(a){var b=this.state,c=a.eventType,d=b&(fc|gc),e=this.attrTest(a);return d&&(c&Bb||!e)?b|jc:d||e?c&Ab?b|hc:b&fc?b|gc:fc:kc}}),j($,Z,{defaults:{event:"pan",threshold:10,pointers:1,direction:Jb},getTouchAction:function(){var a=this.options.direction,b=[];return a&Hb&&b.push(dc),a&Ib&&b.push(cc),b},directionTest:function(a){var b=this.options,c=!0,d=a.distance,e=a.direction,f=a.deltaX,g=a.deltaY;return e&b.direction||(b.direction&Hb?(e=0===f?Cb:0>f?Db:Eb,c=f!=this.pX,d=Math.abs(a.deltaX)):(e=0===g?Cb:0>g?Fb:Gb,c=g!=this.pY,d=Math.abs(a.deltaY))),a.direction=e,c&&d>b.threshold&&e&b.direction},attrTest:function(a){return Z.prototype.attrTest.call(this,a)&&(this.state&fc||!(this.state&fc)&&this.directionTest(a))},emit:function(a){this.pX=a.deltaX,this.pY=a.deltaY;var b=X(a.direction);b&&this.manager.emit(this.options.event+b,a),this._super.emit.call(this,a)}}),j(_,Z,{defaults:{event:"pinch",threshold:0,pointers:2},getTouchAction:function(){return[bc]},attrTest:function(a){return this._super.attrTest.call(this,a)&&(Math.abs(a.scale-1)>this.options.threshold||this.state&fc)},emit:function(a){if(this._super.emit.call(this,a),1!==a.scale){var b=a.scale<1?"in":"out";this.manager.emit(this.options.event+b,a)}}}),j(ab,V,{defaults:{event:"press",pointers:1,time:500,threshold:5},getTouchAction:function(){return[_b]},process:function(a){var b=this.options,c=a.pointers.length===b.pointers,d=a.distance<b.threshold,f=a.deltaTime>b.time;if(this._input=a,!d||!c||a.eventType&(Ab|Bb)&&!f)this.reset();else if(a.eventType&yb)this.reset(),this._timer=e(function(){this.state=ic,this.tryEmit()},b.time,this);else if(a.eventType&Ab)return ic;return kc},reset:function(){clearTimeout(this._timer)},emit:function(a){this.state===ic&&(a&&a.eventType&Ab?this.manager.emit(this.options.event+"up",a):(this._input.timeStamp=nb(),this.manager.emit(this.options.event,this._input)))}}),j(bb,Z,{defaults:{event:"rotate",threshold:0,pointers:2},getTouchAction:function(){return[bc]},attrTest:function(a){return this._super.attrTest.call(this,a)&&(Math.abs(a.rotation)>this.options.threshold||this.state&fc)}}),j(cb,Z,{defaults:{event:"swipe",threshold:10,velocity:.65,direction:Hb|Ib,pointers:1},getTouchAction:function(){return $.prototype.getTouchAction.call(this)},attrTest:function(a){var b,c=this.options.direction;return c&(Hb|Ib)?b=a.velocity:c&Hb?b=a.velocityX:c&Ib&&(b=a.velocityY),this._super.attrTest.call(this,a)&&c&a.direction&&a.distance>this.options.threshold&&mb(b)>this.options.velocity&&a.eventType&Ab},emit:function(a){var b=X(a.direction);b&&this.manager.emit(this.options.event+b,a),this.manager.emit(this.options.event,a)}}),j(db,V,{defaults:{event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:2,posThreshold:10},getTouchAction:function(){return[ac]},process:function(a){var b=this.options,c=a.pointers.length===b.pointers,d=a.distance<b.threshold,f=a.deltaTime<b.time;if(this.reset(),a.eventType&yb&&0===this.count)return this.failTimeout();if(d&&f&&c){if(a.eventType!=Ab)return this.failTimeout();var g=this.pTime?a.timeStamp-this.pTime<b.interval:!0,h=!this.pCenter||I(this.pCenter,a.center)<b.posThreshold;this.pTime=a.timeStamp,this.pCenter=a.center,h&&g?this.count+=1:this.count=1,this._input=a;var i=this.count%b.taps;if(0===i)return this.hasRequireFailures()?(this._timer=e(function(){this.state=ic,this.tryEmit()},b.interval,this),fc):ic}return kc},failTimeout:function(){return this._timer=e(function(){this.state=kc},this.options.interval,this),kc},reset:function(){clearTimeout(this._timer)},emit:function(){this.state==ic&&(this._input.tapCount=this.count,this.manager.emit(this.options.event,this._input))}}),eb.VERSION="2.0.4",eb.defaults={domEvents:!1,touchAction:$b,enable:!0,inputTarget:null,inputClass:null,preset:[[bb,{enable:!1}],[_,{enable:!1},["rotate"]],[cb,{direction:Hb}],[$,{direction:Hb},["swipe"]],[db],[db,{event:"doubletap",taps:2},["tap"]],[ab]],cssProps:{userSelect:"none",touchSelect:"none",touchCallout:"none",contentZooming:"none",userDrag:"none",tapHighlightColor:"rgba(0,0,0,0)"}};var lc=1,mc=2;fb.prototype={set:function(a){return h(this.options,a),a.touchAction&&this.touchAction.update(),a.inputTarget&&(this.input.destroy(),this.input.target=a.inputTarget,this.input.init()),this},stop:function(a){this.session.stopped=a?mc:lc},recognize:function(a){var b=this.session;if(!b.stopped){this.touchAction.preventDefaults(a);var c,d=this.recognizers,e=b.curRecognizer;(!e||e&&e.state&ic)&&(e=b.curRecognizer=null);for(var f=0;f<d.length;)c=d[f],b.stopped===mc||e&&c!=e&&!c.canRecognizeWith(e)?c.reset():c.recognize(a),!e&&c.state&(fc|gc|hc)&&(e=b.curRecognizer=c),f++}},get:function(a){if(a instanceof V)return a;for(var b=this.recognizers,c=0;c<b.length;c++)if(b[c].options.event==a)return b[c];return null},add:function(a){if(f(a,"add",this))return this;var b=this.get(a.options.event);return b&&this.remove(b),this.recognizers.push(a),a.manager=this,this.touchAction.update(),a},remove:function(a){if(f(a,"remove",this))return this;var b=this.recognizers;return a=this.get(a),b.splice(s(b,a),1),this.touchAction.update(),this},on:function(a,b){var c=this.handlers;return g(r(a),function(a){c[a]=c[a]||[],c[a].push(b)}),this},off:function(a,b){var c=this.handlers;return g(r(a),function(a){b?c[a].splice(s(c[a],b),1):delete c[a]}),this},emit:function(a,b){this.options.domEvents&&hb(a,b);var c=this.handlers[a]&&this.handlers[a].slice();if(c&&c.length){b.type=a,b.preventDefault=function(){b.srcEvent.preventDefault()};for(var d=0;d<c.length;)c[d](b),d++}},destroy:function(){this.element&&gb(this,!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}},h(eb,{INPUT_START:yb,INPUT_MOVE:zb,INPUT_END:Ab,INPUT_CANCEL:Bb,STATE_POSSIBLE:ec,STATE_BEGAN:fc,STATE_CHANGED:gc,STATE_ENDED:hc,STATE_RECOGNIZED:ic,STATE_CANCELLED:jc,STATE_FAILED:kc,DIRECTION_NONE:Cb,DIRECTION_LEFT:Db,DIRECTION_RIGHT:Eb,DIRECTION_UP:Fb,DIRECTION_DOWN:Gb,DIRECTION_HORIZONTAL:Hb,DIRECTION_VERTICAL:Ib,DIRECTION_ALL:Jb,Manager:fb,Input:y,TouchAction:T,TouchInput:Q,MouseInput:M,PointerEventInput:N,TouchMouseInput:S,SingleTouchInput:O,Recognizer:V,AttrRecognizer:Z,Tap:db,Pan:$,Swipe:cb,Pinch:_,Rotate:bb,Press:ab,on:n,off:o,each:g,merge:i,extend:h,inherit:j,bindFn:k,prefixed:v}),typeof define==kb&&define.amd?define(function(){return eb}):"undefined"!=typeof module&&module.exports?module.exports=eb:a[c]=eb}(window,document,"Hammer");}
