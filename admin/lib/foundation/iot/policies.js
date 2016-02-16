'use strict';

var config = require('dragonsense-config');

var POLICY_VERSION = "2012-10-17";
var ALLOW = "Allow";

function createIotArn(resource) {
  return ['arn:aws:iot', config.region, config.accountNumber, resource].join(':');
}

module.exports = {
  DragonSenseThing: {
    "Version": POLICY_VERSION,
    "Statement": [
      {
        "Effect": ALLOW,
        "Action": [
          "iot:Connect"
        ],
        "Resource": [
          "*"
        ]
      },
      {
        "Effect": ALLOW,
        "Action": [
          "iot:Publish"
        ],
        "Resource": [
          createIotArn('topic/things/*/sensors')
        ]
      },
      {
        "Effect": ALLOW,
        "Action": [
          "iot:Publish"
        ],
        "Resource": [
          createIotArn('topic/things/*/sensors/*/observations')
        ]
      }
    ]
  }
};