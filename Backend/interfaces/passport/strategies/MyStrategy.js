const { Strategy } = require("passport-strategy");

class MyStrategy extends Strategy {
  constructor(name, verify) {
    super();
    this.name = name;
    this.verify = verify;
  }

  authenticate(req, options) {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return this.fail({ message: "Missing credentials" }, 400);
    }
    this.verify(username, password, email, (err, token, info) => {
      if (err) {
        console.error("Error in verify function:", err);
        return this.error(err);
      }
      if (!token) {
        console.log("Authentication failed:", info);
        return this.fail(info || { message: "Authentication failed" }, 401);
      }
      return this.success(token, info);
    });
  }
}

module.exports = MyStrategy;
