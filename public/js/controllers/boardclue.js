'use strict';

angular.module('myApp.controllers').
  controller('BoardClueCtrl', function ($scope, $modalInstance, response, socket, $sce) {
    console.log('BoardClueCtrl response:', response);
    
    angular.extend($scope, response);
    $scope.show =
      !response.id ? 'scores' :
      response.clue.daily_double ? 'daily' : 'clue';
    
    // Add category name from response
    $scope.category = response.category;

    // Add function to check if media is an audio file
    $scope.isAudioFile = function(url) {
      console.log('Checking if audio file:', url);
      if (!url) {
        console.log('No URL provided');
        return false;
      }
      
      // Handle trusted resource URL
      if (url.$$unwrapTrustedValue) {
        url = url.$$unwrapTrustedValue();
        console.log('Unwrapped trusted URL:', url);
      }
      
      if (typeof url !== 'string') {
        console.log('URL is not a string:', typeof url);
        return false;
      }
      
      const isAudio = url.toLowerCase().endsWith('.mp3') || 
                     url.toLowerCase().endsWith('.wav') || 
                     url.toLowerCase().endsWith('.ogg');
      console.log('Is audio file:', isAudio, 'URL:', url);
      return isAudio;
    };

    // Trust audio URLs
    if ($scope.clue && $scope.clue.media) {
      console.log('Processing clue media:', $scope.clue.media);
      $scope.clue.media = $scope.clue.media.map(function(url) {
        console.log('Processing URL:', url);
        return url ? $sce.trustAsResourceUrl(url) : null;
      }).filter(Boolean);
      console.log('Processed clue media:', $scope.clue.media);
    }

    socket.on('clue:daily', function (data) {
      $scope.show = 'clue';
    });
  });
