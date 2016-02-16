---
---
# DragonConnect API

# Introduction

The DragonConnect Example uses the _Amazon API Gateway_ to fulfill requests
made by the dashboard.  The DragonConnect API is defined using Swagger and
the _Amazon API Gateway_ is configured using the
[Amazon API Gateway Importer](https://github.com/awslabs/aws-apigateway-importer).
The importer takes advantage of the Swagger extensions to configure
Cross-Origin Resource Sharing (CORS).  The importer uses Java 8 so be sure
it is installed on your device.

The operations are defined in the [DragonConnect API](./DragonConnectApi.html).

# API Configuration

Before configuring the API, be sure to configure the foundational elements
of the DragonConnect example.  The foundational elements create the required
IAM roles and policies, IoT policies and topic rules, and DynamoDB tables.

The Swagger definition is contained in the file dragonconnect-template.yaml.
In order to configure the _Amazon API Gateway_, the template must be updated
to substitute the appropriate region, account number, and role extension.
The role extension for the DragonConnect-ApiGateway role may be discovered
by using the output from the following command

```sh
$ aws iam list-roles \
  --query 'Roles[?RoleName.contains(@, `DragonConnect-ApiGateway`)].RoleName' \
  --output text
```

This extension, along with the region and account number, are used to
update the definition using the sed command

```sh
sed -e 's/${region}//g' \
    -e 's/${accountNumber}//g' \
    -e 's/${ext}//g' \
    dragonconnect-template.yaml > dragonconnect.yaml
```

For example, if the region is us-east-1, the account number is 012345678901,
and the extension is faeb then the sed command will be

```sh
sed -e 's/${region}/us-east-1/g' \
    -e 's/${accountNumber}/012345678901/g' \
    -e 's/${ext}/faeb/g' \
    dragonconnect-template.yaml > dragonconnect.yaml
```

A compiled version of the Swagger importer is included as
lib/aws-apigateway-importer.jar.  The following command will configure and
deploy the configuration to the _Amazon API Gateway_ and the __dev__ stage

```sh
$ java -jar lib/aws-apigateway-importer.jar \
  --create --deploy dev dragonconnect.yaml
```

The output of the Swagger importer includes an identifier for the API, but
you can also determine it using the following command

```sh
$ aws apigateway get-rest-apis \
  --query 'items[?name == `Arrow DragonConnect`].id' --output text
```

The URL of the DragonConnect API will be available at

> https://${apiId}.execute-api.${region}.amazonaws.com/${stage}

Keep this URL as it will be needed for the web pages.
