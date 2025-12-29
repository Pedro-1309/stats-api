const express = require('express');
const router = express.Router();
const controller = require('../controllers/statsController');

router.route('/stats/:userId')
    .get(controller.getStats)
    .post(controller.addStat)
    .put(controller.addResult)
    .delete(controller.removePlayer);

router.route('/stats/history/:userId')
    .get(controller.getHistory);    

module.exports = router;