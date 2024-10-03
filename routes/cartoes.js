const path = require('path');

router.get('/view', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'cartoes.html'));
});

module.exports = router;
