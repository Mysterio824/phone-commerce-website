const MyError = require('../modules/cerror');


module.exports = {
    getAuth: (req, res, next) => {
        try {
            res.render('auth/auth', {
                layout: 'blank',
            });
        } catch (error) {
            next(new MyError(404, error.message));
        }
    },

    
    confirm: async (req, res, next) => {
        const { token } = req.params;
        // try {
        //     const user = await accountM.one('remember_token', token);

        //     if (!user) {
        //         return res.status(400).json({ message: "Invalid or expired token" });
        //     }

        //     const newPayment = {
        //         user_id: user.id,
        //         email: user.email,
        //         username: user.username,
        //         password: user.password,
        //         balance: Number(process.env.INIT_BALANCE)
        //     };

        //     const response = await paymentRequest.post("/auth/new", JSON.stringify({ user: newPayment }));

        //     if (response.status !== 201) {
        //         return res.redirect('/auth');
        //     }
        //     user.remember_token = '';
        //     await accountM.edit(user);
        //     await cartM.add({ user_id: user.id });

        //     await sendEmail(
        //         user.email,
        //         "Your Account Information",
        //         `Welcome to our app, ${user.username}! Here are your payment account details:`,
        //         `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
        //             <h2 style="color: #333;">Welcome to Our App!</h2>
        //             <p>Dear ${user.username},</p>
        //             <p>Here are your account details:</p>
        //             <ul>
        //                 <li><strong>Username:</strong> ${user.username}</li>
        //                 <li><strong>Email:</strong> ${user.email}</li>
        //                 <li><strong>Password </strong> is Your main account password </li>
        //             </ul>
        //             <p>Please use this to login your payment account at <a href='https://localhost:${process.env.TRANSACTION_PORT}/'>Payment</a></p>
        //             <p>Please keep this information safe and do not share it with anyone.</p>
                    
        //             <p>Best regards,<br>Your App Team</p>
        //         </div>`
        //     );

        //     res.render('auth/thankYou', { layout: 'blank', message: "Email confirmed successfully!" });
        // } catch (error) {
        //     console.error(error.message);

        //     next(new MyError(404, error.message))
        // }
    },

    verifyEmail: (req, res, next) => {
        try {
            const name = req.params.name;
            res.render('auth/verifyEmail', { layout: 'blank', name });
        } catch (error) {
            next(new MyError(404, error.message));
        }
    }
}