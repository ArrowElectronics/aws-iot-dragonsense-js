'use strict';

var Bluebird = require('bluebird');

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}

var DynamicRoleHelper = function(iam) {
  if (!iam) {
    throw new TypeError('IAM must be defined');
  }

  this.iam = iam;
};

DynamicRoleHelper.prototype.fetchRoles = function() {
  var awsListRoles = Bluebird.promisify(this.iam.listRoles, { context: this.iam });

  if (!this.roles) {
    return Bluebird.resolve().bind(this).then(function() {
          return awsListRoles({});
        })
      .then(function(result) {
          this.roles = result.Roles;
        });
  }
};

DynamicRoleHelper.prototype.findRole = function(selector) {
  return Bluebird.resolve().bind(this)
    .then(function() {
        return this.fetchRoles();
      })
    .then(function() {
        var returnValue;

        for (var i = 0; i < this.roles.length; i++) {
          var candidate = this.roles[i];

          if (candidate.RoleName.startsWith(selector)) {
            returnValue = candidate;

            break;
          }
        }

        return returnValue;
      });
};

module.exports = DynamicRoleHelper;
