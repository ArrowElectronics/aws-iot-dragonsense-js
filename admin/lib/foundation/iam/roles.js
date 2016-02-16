'use strict';

var POLICY_VERSION = "2012-10-17";
var ALLOW = "Allow";

module.exports = {
  api: {
    trustDocument: {
      "Version": POLICY_VERSION,
      "Statement": [
        {
          "Effect": ALLOW,
          "Principal": {
            "Service": "apigateway.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    managedPolicies: [
      "arn:aws:iam::aws:policy/service-role/AWSLambdaRole"
    ],
    inlinePolicies: {
      IamPassRolePolicy: {
        "Version": POLICY_VERSION,
        "Statement": [
          {
            "Sid": "IamPassRoleStatement",
            "Effect": ALLOW,
            "Action": [
              "iam:PassRole"
            ],
            "Resource": [
              "*"
            ]
          }
        ]
      }
    }
  },
  iot: {
    trustDocument: {
      "Version": POLICY_VERSION,
      "Statement": [
        {
          "Effect": ALLOW,
          "Principal": {
            "Service": "iot.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    managedPolicies: [
      'arn:aws:iam::aws:policy/service-role/AWSIoTLogging'
    ]
  },
  lambda: {
    trustDocument: {
      "Version": POLICY_VERSION,
      "Statement": [
        {
          "Effect": ALLOW,
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    managedPolicies: [
      "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    ],
    inlinePolicies: {
      DynamodbPolicy: {
        "Version": POLICY_VERSION,
        "Statement": [
          {
            "Sid": "DynamodbStatement",
            "Effect": ALLOW,
            "Action": [
              "dynamodb:BatchWriteItem",
              "dynamodb:PutItem",
              "dynamodb:Query",
              "dynamodb:Scan"
            ],
            "Resource": [
              "*"
            ]
          }
        ]
      },
      IotPolicy: {
        "Version": POLICY_VERSION,
        "Statement": [
          {
            "Sid": "IotStatement",
            "Effect": ALLOW,
            "Action": [
              "iot:ListThings",
              "iot:ListThingPrincipals",
              "iot:ListPrincipalPolicies"
            ],
            "Resource": [
              "*"
            ]
          }
        ]
      }
    }
  }
};