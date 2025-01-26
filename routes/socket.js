/*
 * Serve content over a socket
 */

var _ = require('lodash');
var jsonfile = require('jsonfile');
var id, datas = {};
const path = require('path');
const LEADERBOARD_FILE = path.join(__dirname, '../leaderboard.json');

module.exports = function (io) {
  return function (socket) {
    socket.on('game:start', function (data) {
      console.log('game:start ' + data.data.id);
      id = data.data.id;
      datas[id] = data;
      data.game.round = 'J';
      io.emit('round:start', data);
    });

    socket.on('round:end', function (data) {
      console.log('round:end ' + data.round);
      if (data.round === 'J') {
        data.round = 'DJ';
        if (data.player_1.score < data.player_2.score && data.player_1.score < data.player_3.score) {
          data.control_player = 'player_1';
        }
        else if (data.player_2.score < data.player_1.score && data.player_2.score < data.player_3.score) {
          data.control_player = 'player_2';
        }
        else if (data.player_3.score < data.player_1.score && data.player_3.score < data.player_2.score) {
          data.control_player = 'player_3';
        }
      }
      else if (data.round === 'DJ') {
        data.round = 'FJ';
        data.control_player = undefined;
      }
      else if (data.round === 'FJ') {
        data.round = 'end';

        var file = 'games/' + id + '-' + new Date().getTime() + '.json';
        jsonfile.writeFileSync(file, data, { spaces: 2 });
      }
      datas[id].game = data;
      io.emit('round:start', datas[id]);
    })

    socket.on('board:init', function () {
      console.log('board:init');
      socket.emit('board:init', datas[id]);
    });

    socket.on('game:init', function (data) {
      console.log('game:init ' + data);
      socket.emit('game:init', datas[data]);
    });

    socket.on('clue:start', function (data) {
      console.log('clue:start ' + data);
      socket.broadcast.emit('clue:start', data);
    });

    socket.on('clue:daily', function (data) {
      console.log('clue:daily');
      socket.broadcast.emit('clue:daily', data);
    });

    socket.on('clue:end', function (data) {
      console.log('clue:end');
      datas[id].game = data;
      socket.broadcast.emit('clue:end', data);
    });

    socket.on('score:adjust', function (data) {
      console.log('score:adjust');
      socket.broadcast.emit('score:adjust', data);
    });

    socket.on('coryat:show', function (data) {
      console.log('coryat:show');
      socket.broadcast.emit('coryat:show', data);
    });

    socket.on('leaderboard:show', function () {
      console.log('leaderboard:show');
      try {
        const leaderboard = jsonfile.readFileSync(LEADERBOARD_FILE);
        
        // Transform and sort players by totalWinnings
        const topEarnings = Object.entries(leaderboard.players || {})
          .map(([playerName, stats]) => ({
            playerName,
            totalWinnings: stats.totalWinnings || 0
          }))
          .sort((a, b) => b.totalWinnings - a.totalWinnings)
          .slice(0, 10);

        const topWins = Object.entries(leaderboard.players || {})
          .map(([playerName, stats]) => ({
            playerName,
            gamesWon: stats.gamesWon || 0
          }))
          .sort((a, b) => b.gamesWon - a.gamesWon)
          .slice(0, 10);

        socket.broadcast.emit('leaderboard:show', {
          topEarnings,
          topWins,
          topScores: leaderboard.topScores || [],
          topStreaks: leaderboard.topStreaks || []
        });
      } catch (error) {
        console.error('Error showing leaderboard:', error);
      }
    });
  };
};
