'use strict';

angular.module('myApp.controllers').
  controller('GameCtrl', function ($scope, $modal, response, socket) {
    $scope.data = response.data;
    $scope.hideComments = {};

    socket.emit('game:init', $scope.data.id);

    socket.on('game:init', function (data) {
      console.log('game:init ' + !!data);
      if (data) {
        $scope.game = data.game;
      }
    })

    socket.on('round:start', function (data) {
      console.log('round:start');
      $scope.game = data.game;
    });

    $scope.startGame = function () {
      console.log('game:start emit');
      socket.emit('game:start', {
        data: $scope.data,
        game: $scope.game
      }, function (result) {
        console.log('callback');
      });
    };

    $scope.startClue = function (id) {
      console.log('clue:start emit ' + id);
      socket.emit('clue:start', id);
      var modalInstance = $modal.open({
        templateUrl: 'partials/gameclue',
        controller: 'GameClueCtrl',
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
        openedClass: 'game-modal-open',
        resolve: {
          response: function () {
            var split = id.split('_').slice(0, 3);
            split[0] = 'category';

            if (split.length === 2) {
              split.push(1);
            }

            return {
              id: id,
              category: $scope.data[split.join('_')],
              clue: $scope.data[id],
              game: $scope.game
            };
          }
        }
      });

      modalInstance.result.then(function (result) {
        angular.extend($scope.game, result);

        // Keep score.
        result = result[id];
        [1, 2, 3].forEach(function (num) {
          var key = 'player_' + num
          $scope.game[key] = $scope.game[key] || {};
          $scope.game[key].score = $scope.game[key].score || 0;
          $scope.game[key].correct = $scope.game[key].correct || 0;
          $scope.game[key].incorrect = $scope.game[key].incorrect || 0;
          $scope.game[key].dd_correct = $scope.game[key].dd_correct || 0;
          $scope.game[key].dd_incorrect = $scope.game[key].dd_incorrect || 0;
          $scope.game[key].coryat = $scope.game[key].coryat || 0;

          var value = id === 'clue_FJ' ? parseInt($scope.game[key].fj_wager) : result.value;
          var coryatValue = id === 'clue_FJ' ? 0 : (result.isDD ? result.originalValue : result.value);

          if (result[key] && result[key].right) {
            $scope.game[key].score += value;
            $scope.game[key].coryat += coryatValue;
            if (!id.startsWith('clue_FJ')) {  // Don't count FJ in stats
              if (result.isDD) {
                $scope.game[key].dd_correct += 1;
              }
              $scope.game[key].correct += 1;
            }
            $scope.game.control_player = key;
          }
          else if (result[key] && result[key].wrong) {
            $scope.game[key].score -= value;
            $scope.game[key].coryat -= coryatValue;
            if (!id.startsWith('clue_FJ')) {  // Don't count FJ in stats
              if (result.isDD) {
                $scope.game[key].dd_incorrect += 1;
              } 
              $scope.game[key].incorrect += 1;
            }
          }
        });
        console.log('clue:end emit');
        socket.emit('clue:end', $scope.game);
      });
    };

    $scope.endRound = function () {
      console.log('round:end emit');
      socket.emit('round:end', $scope.game);
    };

    $scope.toggleComments = function (category) {
      $scope.hideComments[category] = !$scope.hideComments[category];
    }

    $scope.resetGame = function () {
      $scope.game = {
        control_player: 'player_1'
      };
      [1, 2, 3].forEach(function(num) {
        var key = 'player_' + num;
        $scope.game[key] = {
          score: 0,
          correct: 0,
          incorrect: 0,
          coryat: 0,
        };
      });
    };

    $scope.adjustScore = function(playerNum) {
      var modalInstance = $modal.open({
        templateUrl: 'partials/adjustscore',
        controller: 'AdjustScoreCtrl',
        size: 'sm',
        resolve: {
          player: function() {
            return {
              number: playerNum,
              name: $scope.game['player_' + playerNum].name,
              currentScore: $scope.game['player_' + playerNum].score || 0
            };
          }
        }
      });

      modalInstance.result.then(function(result) {
        var playerKey = 'player_' + playerNum;
        var oldScore = $scope.game[playerKey].score || 0;
        $scope.game[playerKey].score = result.newScore;
        
        // Add score correction to game history
        $scope.game.corrections = $scope.game.corrections || [];
        $scope.game.corrections.push({
          timestamp: new Date().toISOString(),
          player: playerKey,
          oldScore: oldScore,
          newScore: result.newScore,
          adjustment: result.newScore - oldScore
        });
        
        socket.emit('score:adjust', $scope.game);
      });
    };

    $scope.showCoryat = function() {
      console.log('coryat:show emit');
      socket.emit('coryat:show', $scope.game);
    };

    $scope.resetGame();
  });
