 'use strict';

angular.module('myApp.controllers').
  controller('BoardLeaderboardCtrl', function ($scope, response) {
    $scope.topEarnings = response.topEarnings || [];
    $scope.topWins = response.topWins || [];
    $scope.topScores = response.topScores || [];
    $scope.topStreaks = response.topStreaks || [];
  });