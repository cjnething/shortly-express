var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

  initialize: function() {
    // this.on('creating', this.encrypt(this));
  },

  encrypt : function(password, next){
    var that = this;
    bcrypt.genSalt(null, function(err, res) {
      if (err) {
        console.log(err);
      } else {
        that.set('salt', res);
        bcrypt.hash(password, that.get('salt'), null, function(err, res) {
          if (err) {
            console.log(err);
          } else {
            that.set('hash', res);
            next();
          }
        })
      }
    });
  }
});
module.exports = User;
