const statsController = require('./statsController');
const { statsModel } = require('../models/statsModel');

jest.mock('../models/statsModel');

describe('Stats Controller', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        // setup default request/response objects
        jest.clearAllMocks();
        
        mockReq = {
            userInfo: { id: 'user_123' },
            body: {}
        };
        
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
    });

    describe('addResult', () => {
        test('process an array of game results', async () => {
            mockReq.body = [
                { _id: 'user_123', result: 'WON', role: 'VILLAGER', numbOfPlayers: 8, gameMode: 'classic' },
                { _id: 'user_456', result: 'LOST', role: 'WEREWOLF', numbOfPlayers: 8, gameMode: 'classic' }
            ];

            statsModel.findOneAndUpdate.mockResolvedValue({ some: 'updatedData' });
            await statsController.addResult(mockReq, mockRes);
            await new Promise(process.nextTick);

            expect(statsModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
            expect(statsModel.findOneAndUpdate).toHaveBeenNthCalledWith(
                1,
                { _id: 'user_123' },
                expect.objectContaining({
                    $inc: { totalGames: 1, totalWins: 1 }
                }),
                expect.any(Object)
            );
            expect(statsModel.findOneAndUpdate).toHaveBeenNthCalledWith(
                2,
                { _id: 'user_456' },
                expect.objectContaining({
                    $inc: { totalGames: 1, totalWins: 0 }
                }),
                expect.any(Object)
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        test('return 500 if a database update fails', async () => {
            mockReq.body = [{ _id: 'user_123', result: 'WON' }];
            
            statsModel.findOneAndUpdate.mockRejectedValue(new Error('Database Error'));

            await statsController.addResult(mockReq, mockRes);
            await new Promise(process.nextTick);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Database Error' });
        });
    });

    describe('getStats', () => {
        test('check if userInfo.id is missing', async () => {
            mockReq.userInfo.id = undefined;

            await statsController.getStats(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "ID missing in authentication info" });
            expect(statsModel.findOne).not.toHaveBeenCalled();
        });

        test('check if the user stats do not exist in the database', async () => {
            statsModel.findOne.mockResolvedValue(null);

            await statsController.getStats(mockReq, mockRes);
            await new Promise(process.nextTick);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith("User not found");
        });

        test('get player stats successfully', async () => {
            const mockDbStats = {
                totalGames: 10,
                totalWins: 6,
                totalLosses: 4,
                winRate: 60,
                history: []
            };
            statsModel.findOne.mockResolvedValue(mockDbStats);

            await statsController.getStats(mockReq, mockRes);
            await new Promise(process.nextTick);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                totalGames: 10,
                totalWins: 6,
                totalLosses: 4,
                winRate: 60
            });
        });
    });
});