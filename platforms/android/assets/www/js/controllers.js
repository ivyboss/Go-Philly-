angular.module('starter.controllers', [])

.controller('MapCtrl', function($rootScope, $scope, $ionicLoading, $compile, $state, $http, $timeout, $ionicPopup) {
    $scope.submitLocations = function() {
        var start = $scope.location.start;
        var end = $scope.location.end;
        $rootScope.startLocation = start;
        $rootScope.endLocation = end;
        var googleKey = "AIzaSyDOeBvCcjFxfGnvcrS4a4RZ7dgqi3kbGKc";
        var source = "https://maps.googleapis.com/maps/api/geocode/json?address=" + start + "&key=" + googleKey;
        var origin, destination;
        $http.get(source).success(function(data) {
            if (data && data.results) {
                origin = data.results[0].geometry.location;
                var source = "https://maps.googleapis.com/maps/api/geocode/json?address=" + end + "&key=" + googleKey;
                $http.get(source).success(function(data2) {
                    if (data2 && data2.results) {
                        if (data2.results[0] === undefined) {
                            var myPopup1 = $ionicPopup.show({
                                title: 'Invalid locations',
                                subTitle: 'Please re-enter the correct locations',
                                scope: $scope,
                                buttons: [{
                                    text: 'Return!',
                                    type: 'button-positive'
                                }]
                            });
                            myPopup1.then(function(res) {
                                $state.go('app.start');
                            });
                        } else {
                            destination = data2.results[0].geometry.location;
                            $rootScope.listUber = $scope.getListUber(origin, destination);
                            $state.go('app.flist');
                        }
                    }
                });
            }
        });
    };
    $rootScope.getDetail = function(data) {
        if (data.name.toLowerCase().indexOf('uberxl') > -1) $state.go('app.uberxl');
        else if (data.name.toLowerCase().indexOf('uberx') > -1) $state.go('app.uberx');
        else if (data.name.toLowerCase().indexOf('uberblack') > -1) $state.go('app.uberblack');
        else if (data.name.toLowerCase().indexOf('ubersuv') > -1) $state.go('app.ubersuv');
        else if (data.name.toLowerCase().indexOf('uberfamily') > -1) $state.go('app.uberfamily');
    };
    $rootScope.isUber = function(data) {
        return data.name.toLowerCase().indexOf('uber') > -1;
    };
    $scope.getListUber = function(origin, destination) {
        var url = 'https://api.uber.com/v1/estimates/price?server_token=yaxyXHwMLN6-xh8EOuP3LMmQbDSYR2UP3aQCGeNB&start_latitude=' + origin.lat;
        url += '&start_longitude=' + origin.lng;
        url += '&end_latitude=' + destination.lat;
        url += '&end_longitude=' + destination.lng;

        var req = {
            'method': 'GET',
            'url': url,
            'dataType': 'json'
        }

        $http(req).then(function(uberPrice) {
            $rootScope.uberPrice = uberPrice.data.prices;
            url = 'https://api.uber.com/v1/estimates/time?server_token=yaxyXHwMLN6-xh8EOuP3LMmQbDSYR2UP3aQCGeNB&start_latitude=' + origin.lat;
            url += '&start_longitude=' + origin.lng;
            req = {
                'method': 'GET',
                'url': url,
                'dataType': 'json'
            };

            var originUber = new google.maps.LatLng(origin.lat, origin.lng);
            var destinationUber = new google.maps.LatLng(destination.lat, destination.lng);
            $rootScope.datas = [];
            for (var price in $rootScope.uberPrice) {
                var result = "";
                result += Number(($rootScope.uberPrice[price].duration) / 60).toFixed(0) + " mins";
                $rootScope.datas.push({
                    image: "Uber.jpg",
                    name: $rootScope.uberPrice[price].display_name,
                    price: $rootScope.uberPrice[price].estimate,
                    distance: $rootScope.uberPrice[price].distance + " miles",
                    duration: result
                });
            }
            var directionsService = new google.maps.DirectionsService;
            directionsService.route({
                    origin: originUber,
                    destination: destinationUber,
                    travelMode: google.maps.TravelMode.TRANSIT,
                    transitOptions: {
                      modes: [google.maps.TransitMode.BUS]
                    }
                }, function(response, status) {
                if(response.routes.length > 0) {
                  for(var i in response.routes) {
                    $rootScope.datas.push({
                      name: "Bus",
                      image: "septaBus.jpg",
                      distance: response.routes[i].legs[0].distance.text,
                      duration: response.routes[i].legs[0].duration.text,
                      price:response.routes[i].fare.text
                    });
                  }
                }
                $rootScope.$apply();
            });
            directionsService.route({
                    origin: originUber,
                    destination: destinationUber,
                    travelMode: google.maps.TravelMode.TRANSIT,
                    transitOptions: {
                      modes: [google.maps.TransitMode.TRAM]
                    }
                }, function(response, status) {
                  
                if(response.routes.length > 0) {
                  for(var i in response.routes) {
                    $rootScope.datas.push({
                      name: "Trolley",
                      image: "trolley.jpg",
                      distance: response.routes[i].legs[0].distance.text,
                      duration: response.routes[i].legs[0].duration.text,
                      price:response.routes[i].fare.text
                    });
                  }
                }
                $rootScope.$apply();
            });
        }, function(err) {
            // An elaborate, custom popup
            var myPopup = $ionicPopup.show({
                title: 'Invalid locations',
                subTitle: 'Please re-enter the correct locations',
                scope: $scope,
                buttons: [{
                    text: 'Go back!',
                    type: 'button-positive'
                }]
            });
            myPopup.then(function(res) {
                $state.go('app.start');
            });
        });
    };

    $scope.location = {};
    // function initialize() {
    //   var mapOptions = {
    //     zoom: 16,
    //     mapTypeId: google.maps.MapTypeId.ROADMAP
    //   };
    //   var map = new google.maps.Map(document.getElementById("map"),
    //       mapOptions);
    //   $scope.map = map;
    //   $scope.loading = $ionicLoading.show({
    //     content: 'Getting current location...',
    //     showBackdrop: false
    //   });
    //   $ionicLoading.hide();
    //   debugger;
    //   navigator.geolocation.getCurrentPosition(function(pos) {
    //     $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
    //     var marker = new google.maps.Marker({
    //       position: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude),
    //       map: map,
    //       title: 'Uluru (Ayers Rock)'
    //     });

    //     var geocoder = new google.maps.Geocoder();
    //     var latlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
    //     var contentString;
    //     geocoder.geocode({ 'latLng': latlng }, function (results, status) {
    //       if (status == google.maps.GeocoderStatus.OK) {
    //         contentString = "<div>" + results[0].formatted_address + "</div>";
    //         $scope.location.start = results[0].formatted_address;
    //         $scope.$apply();
    //       } else {
    //         contentString = "<div>Your current location!</div>";
    //       }
    //       //Marker + infowindow + angularjs compiled ng-click
    //       var compiled = $compile(contentString)($scope);

    //       var infowindow = new google.maps.InfoWindow({
    //           content: compiled[0]
    //         });
    //         infowindow.open(map,marker);
    //       }, function(error) {
    //         alert('Unable to get location: ' + error.message);
    //     });
    //   });
    // }
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: -34.397,
            lng: 150.644
        },
        zoom: 8
    });
    //google.maps.event.addDomListener(window, 'load', initialize);
});