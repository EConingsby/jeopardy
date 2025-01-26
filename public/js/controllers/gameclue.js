'use strict';

angular.module('myApp.controllers').
  controller('GameClueCtrl', function ($scope, $modalInstance, response, socket, $sce) {
    $scope.category = response.category;
    $scope.clue = response.clue;
    $scope.game = response.game;
    $scope.result = {
      player_1: {},
      player_2: {},
      player_3: {},
      dd_player: response.game.control_player
    };

    // Add function to check if media is an audio file
    $scope.isAudioFile = function(url) {
      if (!url) return false;
      
      // Handle trusted resource URL
      if (url.$$unwrapTrustedValue) {
        url = url.$$unwrapTrustedValue();
      }
      
      if (typeof url !== 'string') return false;
      
      return url.toLowerCase().endsWith('.mp3') || 
             url.toLowerCase().endsWith('.wav') || 
             url.toLowerCase().endsWith('.ogg');
    };

    // Trust audio URLs
    if ($scope.clue && $scope.clue.media) {
      $scope.clue.media = $scope.clue.media.map(function(url) {
        return url ? $sce.trustAsResourceUrl(url) : null;
      }).filter(Boolean);
    }

    var value = response.id.split('_');
    $scope.result.value = $scope.result.dd_value = parseInt(value[3]) * (value[1] === 'J' ? 200 : 400);

    $scope.setResult = function (num, correct) {
      var key = 'player_' + num;
      $scope.result[key][correct ? 'right' : 'wrong'] = !$scope.result[key][correct ? 'right' : 'wrong'];
      $scope.result[key][correct ? 'wrong' : 'right'] = undefined;

      if ($scope.result[key].right && response.id !== 'clue_FJ') {
        if (num === 1) {
          $scope.result.player_2.right = undefined;
          $scope.result.player_3.right = undefined;
        }
        else if (num === 2) {
          $scope.result.player_1.right = undefined;
          $scope.result.player_3.right = undefined;
        }
        else if (num === 3) {
          $scope.result.player_1.right = undefined;
          $scope.result.player_2.right = undefined;
        }
      }
    };

    $scope.setDDValue = function () {
      $scope.result.value = parseInt($scope.result.dd_value);
      $scope.result.dd_confirm = true;
      console.log('clue:daily emit');
      socket.emit('clue:daily', response.id);
    };

    $scope.setDDResult = function (correct) {
      console.log('setDDResult ' + correct);
      $scope.result.dd_result = correct;
    };

    $scope.ok = function () {
      var result = {};
      if ($scope.clue.daily_double) {
        $scope.result[$scope.result.dd_player] = $scope.result[$scope.result.dd_player] || {};
        $scope.result[$scope.result.dd_player][$scope.result.dd_result ? 'right' : 'wrong'] = true;
        $scope.result.isDD = true;
      }
      result[response.id] = $scope.result;
      $modalInstance.close(result);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  });
