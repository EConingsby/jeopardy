'use strict';

angular.module('myApp.controllers').
  controller('BoardCtrl', function ($scope, $timeout, $modal, socket, currencyFilter) {
    socket.emit('board:init');

    socket.on('board:init', function (data) {
      console.log('board:init ' + !!data);
      if (data) {
        $scope.data = data.data;
        $scope.game = data.game;
        $scope.scoreHtml = buildScores();
      }
    })

    function formatStats(player) {
      var ddCorrect = (player && player.dd_correct) || 0;
      var ddIncorrect = (player && player.dd_incorrect) || 0;
      var totalCorrect = (player && player.correct) || 0;
      var totalIncorrect = (player && player.incorrect) || 0;

      var correctText = totalCorrect + ' R';
      if (ddCorrect > 0) {
        correctText += ' (' + ddCorrect + ' DD)';
      }

      var incorrectText = totalIncorrect + ' W';
      if (ddIncorrect > 0) {
        incorrectText += ' (' + ddIncorrect + ' DD)';
      }

      return '<div><span class="correct">' + correctText + '</span></div>' +
             '<div><span class="incorrect">' + incorrectText + '</span></div>';
    }

    function buildScores(isFinal) {
      return '<div class="row">' +
          '<div class="col-md-4 text-center">' +
            '<div class="player-name">' +
              (($scope.game.player_1 && $scope.game.player_1.name) || 'Player 1') +
            '</div><div class="player-score">' +
              currencyFilter(($scope.game.player_1 && $scope.game.player_1.score) || 0, '$', 0) +
            '</div>' +
            (isFinal ? '<div class="player-stats">' +
              '<br>' +
              formatStats($scope.game.player_1) +
            '</div>' : '') +
          '</div>' +
          '<div class="col-md-4 text-center">' +
            '<div class="player-name">' +
              (($scope.game.player_2 && $scope.game.player_2.name) || 'Player 2') +
            '</div><div class="player-score">' +
              currencyFilter(($scope.game.player_2 && $scope.game.player_2.score) || 0, '$', 0) +
            '</div>' +
            (isFinal ? '<div class="player-stats">' +
              '<br>' +
              formatStats($scope.game.player_2) +
            '</div>' : '') +
          '</div>' +
          '<div class="col-md-4 text-center">' +
            '<div class="player-name">' +
              (($scope.game.player_3 && $scope.game.player_3.name) || 'Player 3') +
            '</div><div class="player-score">' +
              currencyFilter(($scope.game.player_3 && $scope.game.player_3.score) || 0, '$', 0) +
            '</div>' +
            (isFinal ? '<div class="player-stats">' +
              '<br>' +
              formatStats($scope.game.player_3) +
            '</div>' : '') +
          '</div>' +
        '</div>';
    }

    socket.on('round:start', function (data) {
      console.log('round:start');
      if (modalInstance) {
        modalInstance.close();
      }

      $scope.data = data.data;
      $scope.game = data.game;

      if (data.game.round === 'DJ') {
        openModal();
        $timeout(modalInstance.close, 5000);
      }
      else if (data.game.round === 'FJ') {
        $scope.scoreHtml = buildScores();
      }
      else if (data.game.round === 'end') {
        openFinalModal();
      }
    });

    var modalInstance;
    function openModal (id) {
      if (modalInstance) {
        modalInstance.close();
      }

      modalInstance = $modal.open({
        templateUrl: 'partials/boardclue',
        controller: 'BoardClueCtrl',
        backdrop: 'static',
        size: 'lg',
        openedClass: 'board-modal-open',
        resolve: {
          response: function () {
            var split = id ? id.split('_').slice(0, 3) : [];
            split[0] = 'category';

            if (split.length === 2) {
              split.push(1);
            }

            return {
              id: id,
              clue: $scope.data[id],
              category: id ? $scope.data[split.join('_')] : null,
              game: $scope.game,
              scoreHtml: buildScores()
            };
          }
        }
      });
    };

    function openFinalModal() {
      if (modalInstance) {
        modalInstance.close();
      }

      modalInstance = $modal.open({
        templateUrl: 'partials/boardclue',
        controller: 'BoardClueCtrl',
        backdrop: 'static',
        size: 'lg',
        openedClass: 'board-modal-open',
        resolve: {
          response: function () {
            return {
              id: null,
              clue: null,
              category: null,
              game: $scope.game,
              scoreHtml: buildScores(true),
              isFinal: true
            };
          }
        }
      });
    }

    socket.on('clue:start', function (data) {
      console.log('clue:start ' + data);
      openModal(data);
    });

    socket.on('clue:end', function (data) {
      console.log('clue:end');
      $scope.game = data;
      if (modalInstance) {
        modalInstance.close();
      }
    });

    socket.on('score:adjust', function (data) {
      console.log('score:adjust');
      $scope.game = data;
      $scope.scoreHtml = buildScores();
    });

    socket.on('coryat:show', function (data) {
      console.log('coryat:show');
      if (modalInstance) {
        modalInstance.close();
      }

      modalInstance = $modal.open({
        templateUrl: 'partials/boardcoryat',
        controller: 'BoardCoryatCtrl',
        backdrop: 'static',
        size: 'lg',
        openedClass: 'board-modal-open',
        resolve: {
          response: function () {
            return {
              game: data,
              data: $scope.data
            };
          }
        }
      });
    });

    socket.on('leaderboard:show', function (data) {
      console.log('leaderboard:show');
      if (modalInstance) {
        modalInstance.close();
      }

      modalInstance = $modal.open({
        templateUrl: 'partials/boardleaderboard',
        controller: 'BoardLeaderboardCtrl',
        backdrop: 'static',
        size: 'lg',
        resolve: {
          response: function () {
            return data;
          }
        }
      });
    });
  });
