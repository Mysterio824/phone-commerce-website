const MyError = require('../modules/cerror');

module.exports = {
    getLobby: (req, res, next) => {
        try {
            const user = req.user || {};
            res.cookie('search_query', '', { httpOnly: true, maxAge: 60000 });
            res.render('users/lobby', { user });
        } catch (error) {
            console.error(error.message);
            return next(new MyError(404, error.message));
        }
    },

    getSearchPage: (req, res, next) => {
        try {
            const user = req.user || {};
            const query = req.cookies.search_query || '';

            res.render('users/searchPage', { user, query });
        } catch (error) {
            console.error(error.message);
            next(new MyError(error.status, error.message));
        }
    },

    storeQuery: (req, res, next) => {
        try {
            const query = req.body.query;
            res.cookie('search_query', query, { httpOnly: true, maxAge: 60000 });
            res.status(200).json({ message: 'Query stored successfully.' });
        } catch (error) {
            console.error(error.message);
            res.status(error.status).json({ message: error.message });
        }
    },
}