'use strict';

angular.module('myApp.controllers').
  controller('BoardCoryatCtrl', function ($scope, response) {
    $scope.game = response.game;
    $scope.data = response.data;
  }); 