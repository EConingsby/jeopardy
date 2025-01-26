const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');

const LEADERBOARD_FILE = path.join(__dirname, '../leaderboard.json');
const GAMES_DIR = path.join(__dirname, '../games');
const MIN_GAMES_PLAYED = 10;
const TOP_SCORES_COUNT = 10;
const TOP_STREAKS_COUNT = 10;

// Initialize leaderboard if it doesn't exist
if (!fs.existsSync(LEADERBOARD_FILE)) {
  jsonfile.writeFileSync(LEADERBOARD_FILE, {
    players: {},
    topScores: [],
    topStreaks: [],
    lastUpdated: null,
    lastProcessedTimestamp: 0
  });
}

function processNewGames() {
  const leaderboard = jsonfile.readFileSync(LEADERBOARD_FILE);
  const lastProcessed = leaderboard.lastProcessedTimestamp;
  
  // Get all game files created since last processed timestamp and sort by timestamp
  const gameFiles = fs.readdirSync(GAMES_DIR)
    .filter(file => {
      const parts = file.split('-');
      if (parts.length < 2) return false;
      const timestamp = parseInt(parts[1].split('.')[0]);
      return !isNaN(timestamp) && timestamp > lastProcessed;
    })
    .sort((a, b) => {
      const timeA = parseInt(a.split('-')[1]);
      const timeB = parseInt(b.split('-')[1]);
      return timeA - timeB;
    })
    .map(file => path.join(GAMES_DIR, file));

  // Create temporary objects to store stats
  const allPlayers = {...leaderboard.players};
  let topScores = [...(leaderboard.topScores || [])];
  let currentStreaks = new Map(); // Track current streaks
  let topStreaks = [...(leaderboard.topStreaks || [])];

  // Process each game file in chronological order
  gameFiles.forEach(file => {
    const game = jsonfile.readFileSync(file);
    const gameDate = new Date(parseInt(path.basename(file).split('-')[1]));
    
    // Find the winner(s)
    let highestScore = -Infinity;
    let winners = [];
    
    ['player_1', 'player_2', 'player_3'].forEach(key => {
      if (!game[key] || !game[key].name || !game[key].score) return;
      
      if (game[key].score > highestScore) {
        highestScore = game[key].score;
        winners = [game[key].name.trim()];
      } else if (game[key].score === highestScore) {
        winners.push(game[key].name.trim());
      }
    });

    // Process top scores
    if (highestScore > 0) {
      winners.forEach(winner => {
        topScores.push({
          playerName: winner,
          score: highestScore,
          date: gameDate.toISOString().split('T')[0]
        });
      });
    }

    // Update streaks for all players
    ['player_1', 'player_2', 'player_3'].forEach(key => {
      const player = game[key];
      if (!player || !player.name) return;
      
      const playerName = player.name.trim();
      if (!playerName) return;

      // Initialize player stats if needed
      if (!allPlayers[playerName]) {
        allPlayers[playerName] = {
          gamesPlayed: 0,
          gamesWon: 0,
          totalWinnings: 0
        };
      }

      allPlayers[playerName].gamesPlayed++;

      // Handle streak tracking
      if (winners.includes(playerName)) {
        allPlayers[playerName].gamesWon++;
        const finalScore = player.score || 0;
        allPlayers[playerName].totalWinnings += Math.max(0, finalScore);

        // Update or start streak
        if (!currentStreaks.has(playerName)) {
          currentStreaks.set(playerName, {
            playerName,
            streakLength: 1,
            startDate: gameDate.toISOString().split('T')[0],
            endDate: gameDate.toISOString().split('T')[0]
          });
        } else {
          const streak = currentStreaks.get(playerName);
          streak.streakLength++;
          streak.endDate = gameDate.toISOString().split('T')[0];
        }
      } else {
        // End streak if exists
        const endingStreak = currentStreaks.get(playerName);
        if (endingStreak && endingStreak.streakLength >= 2) {
          topStreaks.push({...endingStreak});
        }
        currentStreaks.delete(playerName);
      }
    });
  });

  // Add any active streaks to top streaks
  currentStreaks.forEach(streak => {
    if (streak.streakLength >= 2) {
      topStreaks.push({...streak});
    }
  });

  // Sort and limit top scores and streaks
  topScores.sort((a, b) => b.score - a.score);
  topScores = topScores.slice(0, TOP_SCORES_COUNT);

  topStreaks.sort((a, b) => b.streakLength - a.streakLength);
  topStreaks = topStreaks.slice(0, TOP_STREAKS_COUNT);

  // Filter players with minimum games played
  leaderboard.players = Object.entries(allPlayers)
    .filter(([_, stats]) => stats.gamesPlayed >= MIN_GAMES_PLAYED)
    .reduce((acc, [name, stats]) => {
      acc[name] = stats;
      return acc;
    }, {});

  // Update leaderboard
  leaderboard.topScores = topScores;
  leaderboard.topStreaks = topStreaks;
  
  // Update timestamp and save if any new games were processed
  if (gameFiles.length > 0) {
    leaderboard.lastProcessedTimestamp = Date.now();
    leaderboard.lastUpdated = new Date().toISOString();
    jsonfile.writeFileSync(LEADERBOARD_FILE, leaderboard, { spaces: 2 });
    console.log(`Processed ${gameFiles.length} new games for leaderboard`);
  }
}

module.exports = { processNewGames }; 