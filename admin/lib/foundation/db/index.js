'use strict';

var AWS = require('aws-sdk'),
    Bluebird = require('bluebird');

var tables = require('./tables'),
    configureAws = require('./../../util/helper').configureAws;

function createResources(context) {
  configureAws(AWS);

  var dynamoDb = new AWS.DynamoDB();
  var awsDescribeTable = Bluebird.promisify(dynamoDb.describeTable, { context: dynamoDb });
  var awsCreateTable = Bluebird.promisify(dynamoDb.createTable, { context: dynamoDb });


  return Bluebird.each(tables, function(table) {
    return awsDescribeTable({ TableName: table.TableName })
        .then(function(tableDescription) {
            console.info('Table ' + table.TableName + ' already exists');
          })
        .catch(function(err) {
            switch(err.statusCode) {
              case 400: {
                console.info('Creating table ' + table.TableName);
                return awsCreateTable(table)
                  .catch(function(err) {
                      throw err;
                    });
              }
            }

            throw err;
          });
    });
}

function deleteTable(dynamoDb, table) {
  var awsDeleteTable = Bluebird.promisify(dynamoDb.deleteTable, { context: dynamoDb });

  var params = {
    TableName: table.TableName
  };

  return awsDeleteTable(params)
    .then(function() {
        console.info('Deleting table ' + table.TableName);
      })
    .catch(function(err) {
      if (err.code !== 'ResourceNotFoundException') {
        throw err;
      }
    });
}

function deleteResources(context) {
  configureAws(AWS);

  var dynamoDb = new AWS.DynamoDB();

  return Bluebird.each(tables, function(table) {
        deleteTable(dynamoDb, table);
      })
    .catch(function(err) {
        throw err;
      });
}

var manage = function(cmd, context) {
  switch(cmd) {
    case 'create':
      return createResources(context);
      break;
    case 'delete':
      return deleteResources(context);
      break;
    default:
      throw new TypeError('Unknown command of ' + cmd);
  }
};

module.exports = manage;