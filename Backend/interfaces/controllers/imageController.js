const CustomError = require('../../utils/cerror');

imageController = {
    uploadImg: (req, res) => {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send('No files uploaded.');
        }
        
        res.status(201).json({
            message: 'Files uploaded successfully',
            data: {
                files: req.files.map(file => ({
                    filename: file.filename,
                    path: '/imgs/' + file.filename,
                    destination: file.destination,
                })),
            },   
        });
    }
};

module.exports = imageController;