'use strict';

angular.module('myApp.controllers').
  controller('BoardClueCtrl', function ($scope, $modalInstance, response, socket) {
    angular.extend($scope, response);
    $scope.show =
      !response.id ? 'scores' :
      response.clue.daily_double ? 'daily' : 'clue';
    
    // Add category name from response
    $scope.category = response.category;

    socket.on('clue:daily', function (data) {
      console.log('clue:daily ' + data);
      $scope.show = 'clue';
    });
  });
