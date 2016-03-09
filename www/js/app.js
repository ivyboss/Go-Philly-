angular.module('starter', ['ionic', 'starter.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($httpProvider, $stateProvider, $urlRouterProvider) {
  $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
  $stateProvider

    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/social/menu.html"
    })

    .state('app.start', {
      url: "/start",
      views: {
        'menuContent' :{
          templateUrl: "templates/social/start-panel.html"
        }
      },
      controller: 'MapCtrl'
    })

    .state('app.flist', {
      url: "/flist",
      views: {
        'menuContent' :{
          templateUrl: "templates/social/friends.html",
          controller: 'ListCtrl'
        }
      }
    })

    .state('app.map', {
      url: "/map",
      views: {
        'menuContent' :{
          templateUrl: "templates/social/map.html",
          controller: 'DisplayMapCtrl'
        }
      }
    });
    
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/start');
});

