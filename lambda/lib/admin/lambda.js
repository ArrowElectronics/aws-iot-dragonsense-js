var fs = require('fs');

var AWS = require('aws-sdk'),
    Bluebird = require('bluebird'),
    grunt = require('grunt');

var config = require('dragonsense-config');

var DynamicRoleHelper = require('./dynamicrolehelper'),
    permissions = require('./permissions');

function configureAws() {
  AWS.config.update({
    region: config.region
  });
}

function addPermission(lambda, resource) {
  if (permissions.hasOwnProperty(resource)) {
    var awsAddPermission = Bluebird.promisify(lambda.addPermission, { context: lambda });

    return Bluebird.resolve()
      .then(function() {
          return awsAddPermission(permissions[resource])
        })
      .then(function() {
          grunt.log.writeln('Permission for resource ' + resource + ' was added');
        })
      .catch(function(err) {
          switch(err.statusCode) {
            case 409: {
              grunt.log.error('Permission for resource ' + resource + ' already exists');
              break;
            }
            default: {
              throw err;
            }
          }
        });
  }
}

function roleArnBuilder(roleName) {
  return 'arn:aws:iam::' + config.accountNumber + ':role/' + roleName;
}

function reportError(summary, err) {
  grunt.log.error(summary);

  if (err instanceof AWS.Response) {
    grunt.log.error('HTTP Status Code:  ' + err.statusCode);
  }

  grunt.log.error('Message:  ' + err.message);
}

var create = function(resource, zipFile, done) {
  configureAws();

  var lambda = new AWS.Lambda();
  var createFunction = Bluebird.promisify(lambda.createFunction, { context: lambda });

  Bluebird.try(function() {
        return fs.readFileSync(zipFile)
      })
    .then(function() {
        var iam = new AWS.IAM();
        var dynamicRoleHelper = new DynamicRoleHelper(iam);

        return dynamicRoleHelper.findRole(config.iam.lambda.roleName);
      })
    .then(function(role) {
      if (!role) {
        throw new TypeError('Role name must be defined.');
      }

      return Bluebird.resolve()
        .then(function() {
            return fs.readFileSync(zipFile);
          })
        .then(function(content) {
            var lambdaConfig = config['lambda'][resource];

            var params = {
              Code: {
                ZipFile: content
              },
              FunctionName: lambdaConfig.name,
              Handler: lambdaConfig.handler,
              Role: roleArnBuilder(role.RoleName),
              Runtime: 'nodejs',
              MemorySize: 1024,
              Timeout: 5,
              Publish: true
            };

            grunt.log.writeln('Creating lambda function ' + lambdaConfig.name);
            return createFunction(params);
          })
        .then(function() {
            return addPermission(lambda, resource);
          })
        .then(function() {
            done();
          })
        .catch(function(err) {
            reportError('Creating lambda function failed', err);
            done(false);
          });
    })
};

var del = function(resource, done) {
  configureAws();

  var lambda = new AWS.Lambda();
  var deleteFunction = Bluebird.promisify(lambda.deleteFunction, { context: lambda });

  Bluebird.try(function() {
        var params = {
          FunctionName: config['lambda'][resource]['name']
        };

        return deleteFunction(params);
      })
    .then(function(response) {
        grunt.log.writeln('Lambda function deleted');
        done();
      })
    .catch(function(err) {
        switch(err.statusCode) {
          case 404: {
            done();
            break;
          }
          default: {
            reportError('Deleting lambda function failed', err);
            done(false);
          }
        }
      })
};

var update = function(resource, zipFile, done) {
  configureAws();

  var lambda = new AWS.Lambda();
  var updateFunctionCode = Bluebird.promisify(lambda.updateFunctionCode, { context: lambda });

  Bluebird.try(function() {
        return fs.readFileSync(zipFile);
      })
    .then(function(content) {
        var params = {
          FunctionName: config['lambda'][resource]['name'],
          ZipFile: content
        };

        return updateFunctionCode(params);
      })
    .then(function(response) {
        grunt.log.writeln('Lambda function updated:  ' + response.FunctionName);
        done();
      })
    .catch(function(err) {
        reportError('Updating lambda function failed', err);
        done(false);
      })
};

module.exports = {
  create: create,
  del: del,
  update: update
};