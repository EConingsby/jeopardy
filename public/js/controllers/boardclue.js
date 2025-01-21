'use strict';

angular.module('myApp.controllers').
  controller('BoardClueCtrl', function ($scope, $modalInstance, response, socket, $sce) {
    angular.extend($scope, response);
    $scope.show =
      !response.id ? 'scores' :
      response.clue.daily_double ? 'daily' : 'clue';
    
    // Add category name from response
    $scope.category = response.category;

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

    socket.on('clue:daily', function (data) {
      $scope.show = 'clue';
    });
  });
