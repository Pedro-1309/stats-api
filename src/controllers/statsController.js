const { statsModel } = require('../models/statsModel');

exports.getStats = (req, res) => {
    const { userId } = req.params;

    statsModel.findOne({ userId })
        .then(stats => {
            if (!stats) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json({
                totalGames: stats.totalGames,
                totalWins: stats.totalWins,
                totalLosses: stats.totalLosses,
                winRate: stats.winRate
            });
        })
        .catch(error => res.status(500).json({ error: error.message }));
};

exports.addStat = (req, res) => {
    const { userId } = req.params;

    statsModel.findOne({ userId })
        .then(existing => {
            if (existing) {
                return res.status(400).json({ message: "User already exist" });
            }
            const newPlayerStats = new statsModel({ userId });
            return newPlayerStats.save();
        })
        .then(savedStats => {
            if (savedStats) res.status(201).json(savedStats);
        })
        .catch(error => res.status(500).json({ error: error.message }));
};

exports.addResult = (req, res) => {
    const { userId } = req.params;
    const { result, role, numbOfPlayers, gameMode } = req.body;
    const isWin = result === 'won' ? 1 : 0;

    statsModel.findOneAndUpdate(
        { userId },
        {
            $inc: { totalGames: 1, totalWins: isWin },
            $push: {
                history: {
                    $each: [{ result, role, numbOfPlayers, gameMode, playedAt: new Date() }],
                    $position: 0, 
                    $slice: 10    
                }
            }
        },
        { new: true, runValidators: true }
    )
    .then(updatedStats => {
        if (!updatedStats) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(updatedStats);
    })
    .catch(error => res.status(500).json({ error: error.message }));
};

exports.removePlayer = (req, res) => {
    const { userId } = req.params;

    statsModel.findOneAndDelete({ userId })
        .then(deleted => {
            if (!deleted) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json({ message: "Stats removed successfully" });
        })
        .catch(error => res.status(500).json({ error: error.message }));
};

exports.getHistory = (req, res) => {
    const { userId } = req.params;

    statsModel.findOne({ userId }).select('history')
        .then(stats => {
            if (!stats) {
                return res.status(404).json({ message: "History not found" });
            }
            res.status(200).json(stats.history);
        })
        .catch(error => res.status(500).json({ error: error.message }));
};