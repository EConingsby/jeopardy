'use strict';

angular.module('myApp.controllers').
  controller('AdjustScoreCtrl', function ($scope, $modalInstance, player) {
    $scope.player = player;
    $scope.adjustment = 0;
    
    $scope.ok = function () {
      $modalInstance.close({
        newScore: $scope.player.currentScore + parseInt($scope.adjustment)
      });
    };
    
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }); 