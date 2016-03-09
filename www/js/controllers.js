angular.module('starter.controllers', [])
    .controller('DisplayMapCtrl', function($rootScope, $scope) {
        var markerArray = [];
        var directionsService = new google.maps.DirectionsService;
        var map = new google.maps.Map(document.getElementById('supermap'), {
            center: {
                lat: (Number($rootScope.mapData.origin.lat()) + Number($rootScope.mapData.destination.lat()))/2,
                lng: (Number($rootScope.mapData.destination.lng())  + Number($rootScope.mapData.destination.lng()))/2
            }
        });
        map.setZoom(10);
        var directionsDisplay = new google.maps.DirectionsRenderer({
            map: map
        });
        var stepDisplay = new google.maps.InfoWindow;
        var routeObject = {
            origin: $rootScope.mapData.origin,
            destination: $rootScope.mapData.destination,
            travelMode: $rootScope.mapData.mode
        };
        if($rootScope.mapData.mode === google.maps.TravelMode.TRANSIT) {
          if($rootScope.mapData.name === 'Subway') {
            routeObject['transitOptions'] = {
                modes: [google.maps.TransitMode.SUBWAY]
            };
          } else if($rootScope.mapData.name === 'Bus') {
            routeObject['transitOptions'] = {
                modes: [google.maps.TransitMode.BUS]
            };
          }
        }
        directionsService.route(routeObject, function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
                showSteps(response, markerArray, stepDisplay, map);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
        function showSteps(directionResult, markerArray, stepDisplay, map) {
          // For each step, place a marker, and add the text to the marker's infowindow.
          // Also attach the marker to an array so we can keep track of it and remove it
          // when calculating new routes.
          var myRoute = directionResult.routes[0].legs[0];
          for (var i = 0; i < myRoute.steps.length; i++) {
            var marker = markerArray[i] = markerArray[i] || new google.maps.Marker;
            marker.setMap(map);
            marker.setPosition(myRoute.steps[i].start_location);
            attachInstructionText(
                stepDisplay, marker, myRoute.steps[i].instructions, map);
          }
        }

        function attachInstructionText(stepDisplay, marker, text, map) {
          google.maps.event.addListener(marker, 'click', function() {
            // Open an info window when the marker is clicked on, containing the text
            // of the step.
            stepDisplay.setContent(text);
            stepDisplay.open(map, marker);
          });
        }
    })
    .controller('ListCtrl', function($rootScope, $state, $scope) {
        $scope.map = function(data) {
            $rootScope.mapData = data;
            $state.go('app.map');
        };
        $scope.choice = 'comparePrice';
    })
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
        getSmallestValueLongitude = function(array, value) {
            var difference = 9999999;
            var closest = 0;
            for (var i in array) {
                if ((Math.abs(array[i].geometry.coordinates[0] - value)) < difference) {
                    difference = Math.abs(array[i].geometry.coordinates[0] - value);
                    //console.log("difference longitude" + difference);
                    closest = array[i].geometry.coordinates[0];
                }
            }
            return closest;
        }

        getSmallestValueLatidude = function(array, value) {
            var difference = 9999999;
            var closest = 0;
            for (var i in array) {
                if ((Math.abs(array[i].geometry.coordinates[1] - value)) < difference) {
                    difference = Math.abs(array[i].geometry.coordinates[1] - value);
                    //console.log("difference latitude" + difference);
                    closest = array[i].geometry.coordinates[1];
                }
            }
            return closest;
        }

        $scope.getListIndego = function(longitude, latitude) {
            var url = 'https://www.rideindego.com/stations/json/';
            var req = {
                'method': 'GET',
                'url': url,
                'dataType': 'json'
            }
            $http(req).then(function(indegoPrice) {
                var indegoArray = indegoPrice.data.features;
                var closestLongitute = getSmallestValueLongitude(indegoArray, longitude);
                var closestLatitude = getSmallestValueLatidude(indegoArray, latitude);
                return {lon: closestLongitute, lat: closestLatitude};
            }, function(err) {});
        };
        $scope.getSeptaNearestLocation = function(latitude, longitude) {
            console.log(latitude + " latitude" + longitude + " longitude")
            var url = '/api?lon=-75.33299748&lat=40.11043326&radius=3';
            var req = {
                'method': 'GET',
                'url': url,
                'dataType': 'json'
            };
            $http(req).then(function(getLocationsData) {
            }, function(err) {
                console.log("error in getting Septa nearest location")
            });
        };
        $scope.findIndegoPrice = function(second) {
          var minute = (second/60).toFixed(0);
          return Math.ceil(minute / 30)* 4;
        }
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
                        duration: result,
                        origin: originUber,
                        destination: destinationUber,
                        mode: google.maps.TravelMode.DRIVING,
                        compareDuration: $rootScope.uberPrice[price].duration,
                        comparePrice: $rootScope.uberPrice[price].low_estimate,
                        compareDistance: $rootScope.uberPrice[price].distance
                    });
                }
                var directionsService = new google.maps.DirectionsService;
                var indegoUrl = 'https://www.rideindego.com/stations/json/';
                var indegoReq = {
                    'method': 'GET',
                    'url': indegoUrl,
                    'dataType': 'json'
                }
                $http(indegoReq).then(function(indegoPrice) {
                    var indegoArray = indegoPrice.data.features;
                    var startLong = getSmallestValueLongitude(indegoArray, origin.lng);
                    var startLat = getSmallestValueLatidude(indegoArray, origin.lat);
                    var indegoOrigin = new google.maps.LatLng(startLat, startLong);
                    var destLong = getSmallestValueLongitude(indegoArray, destination.lng);
                    var destLat = getSmallestValueLatidude(indegoArray, destination.lat);
                    var indegoDest = new google.maps.LatLng(destLat, destLong);
                    directionsService.route({
                        origin: indegoOrigin,
                        destination: indegoDest,
                        travelMode: google.maps.TravelMode.BICYCLING
                    }, function(response, status) {
                        if (response.routes.length > 0) {
                            for (var i in response.routes) {
                                $rootScope.datas.push({
                                    name: "Indego",
                                    image: "indego.png",
                                    distance: response.routes[i].legs[0].distance.text,
                                    duration: response.routes[i].legs[0].duration.text,
                                    price: '$' + $scope.findIndegoPrice(response.routes[i].legs[0].duration.value),
                                    origin: indegoOrigin,
                                    destination: indegoDest,
                                    mode: google.maps.TravelMode.BICYCLING,
                                    compareDuration: response.routes[i].legs[0].duration.value,
                                    comparePrice: $scope.findIndegoPrice(response.routes[i].legs[0].duration.value),
                                    compareDistance: response.routes[i].legs[0].distance.value * 0.000621371
                                });
                            }
                        }
                        $rootScope.$apply();
                    });
                }, function(err) {});
                directionsService.route({
                    origin: originUber,
                    destination: destinationUber,
                    travelMode: google.maps.TravelMode.TRANSIT,
                    transitOptions: {
                        modes: [google.maps.TransitMode.BUS]
                    }
                }, function(response, status) {
                    if (response.routes.length > 0) {
                        for (var i in response.routes) {
                            $rootScope.datas.push({
                                name: "Bus",
                                image: "bus.gif",
                                distance: response.routes[i].legs[0].distance.text,
                                duration: response.routes[i].legs[0].duration.text,
                                price: response.routes[i].fare.text,
                                origin: originUber,
                                destination: destinationUber,
                                mode: google.maps.TravelMode.TRANSIT,
                                compareDuration: response.routes[i].legs[0].duration.value,
                                comparePrice: response.routes[i].fare.value,
                                compareDistance: response.routes[i].legs[0].distance.value * 0.000621371
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
                        modes: [google.maps.TransitMode.SUBWAY]
                    }
                }, function(response, status) {
                    if (response.routes.length > 0) {
                        for (var i in response.routes) {
                            $rootScope.datas.push({
                                name: "Subway",
                                image: "train.png",
                                distance: response.routes[i].legs[0].distance.text,
                                duration: response.routes[i].legs[0].duration.text,
                                price: response.routes[i].fare.text,
                                origin: originUber,
                                destination: destinationUber,
                                mode: google.maps.TravelMode.TRANSIT,
                                compareDuration: response.routes[i].legs[0].duration.value,
                                comparePrice: response.routes[i].fare.value,
                                compareDistance: response.routes[i].legs[0].distance.value * 0.000621371
                            });
                        }
                    }
                    $rootScope.$apply();
                });
                directionsService.route({
                    origin: originUber,
                    destination: destinationUber,
                    travelMode: google.maps.TravelMode.DRIVING
                }, function(response, status) {
                    if (response.routes.length > 0) {
                        for (var i in response.routes) {
                            $rootScope.datas.push({
                                name: "Self Driving",
                                image: "car.png",
                                distance: response.routes[i].legs[0].distance.text,
                                duration: response.routes[i].legs[0].duration.text,
                                origin: originUber,
                                destination: destinationUber,
                                mode: google.maps.TravelMode.DRIVING,
                                compareDuration: response.routes[i].legs[0].duration.value,
                                comparePrice: 0,
                                compareDistance: response.routes[i].legs[0].distance.value * 0.000621371
                            });
                        }
                    }
                    $rootScope.$apply();
                });
                directionsService.route({
                    origin: originUber,
                    destination: destinationUber,
                    travelMode: google.maps.TravelMode.WALKING
                }, function(response, status) {
                    if (response.routes.length > 0) {
                        for (var i in response.routes) {
                            $rootScope.datas.push({
                                name: "Walking",
                                image: "walk.png",
                                distance: response.routes[i].legs[0].distance.text,
                                duration: response.routes[i].legs[0].duration.text,
                                origin: originUber,
                                destination: destinationUber,
                                mode: google.maps.TravelMode.WALKING,
                                compareDuration: response.routes[i].legs[0].duration.value,
                                comparePrice: 0,
                                compareDistance: response.routes[i].legs[0].distance.value * 0.000621371
                            });
                        }
                    }
                    $rootScope.$apply();
                });
                directionsService.route({
                    origin: originUber,
                    destination: destinationUber,
                    travelMode: google.maps.TravelMode.BICYCLING
                }, function(response, status) {
                    if (response.routes.length > 0) {
                        for (var i in response.routes) {
                            $rootScope.datas.push({
                                name: "Bicycling",
                                image: "bike.png",
                                distance: response.routes[i].legs[0].distance.text,
                                duration: response.routes[i].legs[0].duration.text,
                                origin: originUber,
                                destination: destinationUber,
                                mode: google.maps.TravelMode.BICYCLING,
                                compareDuration: response.routes[i].legs[0].duration.value,
                                comparePrice: 0,
                                compareDistance: response.routes[i].legs[0].distance.value * 0.000621371
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
                lat: 39.9533957,
                lng: -75.188828
            },
            zoom: 16
        });
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(39.9533957, -75.188828),
            map: map,
            title: 'Philly Codefest'
        });
        var stepDisplay = new google.maps.InfoWindow;
        stepDisplay.setContent('Philly Codefest');
        stepDisplay.open(map, marker);
        //google.maps.event.addDomListener(window, 'load', initialize);
    });