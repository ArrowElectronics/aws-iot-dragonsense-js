#!/bin/bash
SCRIPTPATH=$( cd $(dirname $0) ; pwd -P )


BASE_DRAGONBOARD_DIR="/home/linaro/Documents"
DEFAULT_REGISTRY_DIR="registry"
ARROW_DIR="arrow"
ARROW_APPLICATION="aws-iot-dragonsense-js"
ARROW_APP_SEARCH_NEEDLE="DragonSense"
ARROW_APP_NAME="dragonsense"
ARROW_CERT_DIR=""
ARROW_INSTALLER_SETTINGS=".settings"
ARROW_SCRIPTS_DIR=""

AWS_REGION="us-east-1"
AWS_ACCOUNT=""
AWS_API_STAGE="dev"
AWS_S3_IDENTIFIER=""
AWS_API_EXTENSION=""
AWS_API_GATEWAY=""

THING_ID=""

AWS_CONFIG_LOCATION="/home/linaro/.aws/config"

NODE_PATH=""
CERT_REGISTRY_DIR=""

echo -e "################################################"
echo -e "# Welcome to Arrow's $ARROW_APP_SEARCH_NEEDLE for Amazon AWS       "
echo -e "#    This script will setup and provision your $ARROW_APP_SEARCH_NEEDLE"
echo -e "################################################"

echo -e "$ARROW_APP_SEARCH_NEEDLE should exist at $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION"

if [ ! -d "$BASE_DRAGONBOARD_DIR" ]; then
	echo -e "Please provide an alternate base directory:"
	read pPath

	if [ "$pPath" == "" ] ; then
	  echo "Using default path '/home/linaro/Documents'"
	else
	  echo "Using custom path $pPath"
	  BASE_DRAGONBOARD_DIR=$pPath
	fi
fi


#------------------

ARROW_SCRIPTS_DIR="$BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION/scripts/"
#lets remove the current script settings
cd $ARROW_SCRIPTS_DIR

#----------------------------
#installer stuff

if [ -f "$ARROW_INSTALLER_SETTINGS" ]; then
	rm $ARROW_INSTALLER_SETTINGS
fi

#node stuff - it seems that if you screw up install and the node_modules folder is still there, it screws things up
if [ -f "config/index.js" ]; then
	rm config/index.js
fi

if [ -d "admin/node_modules" ]; then
	rm -Rf admin/node_modules
fi

if [ -d "lambda/node_modules" ]; then
	rm -Rf lambda/node_modules
fi

if [ -f "api/$ARROW_APP_NAME.yaml" ]; then
	rm api/$ARROW_APP_NAME.yaml
fi

if [ -d "lambda/dist" ]; then
	rm -Rf lambda/dist
fi

if [ -f "ui/bucket/bucket-policy.json" ]; then
	rm ui/bucket/bucket-policy.json
fi

if [ -f "ui/content/js/config.js" ]; then
	rm ui/content/js/config.js
fi

if [ -f "DragonBoard/src/config.js" ]; then
	rm DragonBoard/src/config.js
fi

#----------------------------

#store to .settings
echo "BASE_DRAGONBOARD_DIR=$BASE_DRAGONBOARD_DIR">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS
echo "ARROW_SCRIPTS_DIR=$ARROW_SCRIPTS_DIR">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS

#------------------

# REMOVE the ability to choose a registry location
#echo -e "Enter a Location to Store Certificates and Keys (Default is $BASE_DRAGONBOARD_DIR/$DEFAULT_REGISTRY_DIR):"
#read pCertDir

#if [ "$pCertDir" != "" ] ; then
#    ARROW_CERT_DIR=$pCertDir
#else
#   ARROW_CERT_DIR=$BASE_DRAGONBOARD_DIR/$DEFAULT_REGISTRY_DIR
#fi

ARROW_CERT_DIR=$BASE_DRAGONBOARD_DIR/$DEFAULT_REGISTRY_DIR

#store to .settings
echo "ARROW_CERT_DIR=$ARROW_CERT_DIR">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS

#------------------

#read the region - read from ~/.aws/config
#TODO (gtam): make it configurable instead of assuming dragonboard
awsFile=$AWS_CONFIG_LOCATION

if [ -f "$awsFile" ]
then
  while IFS='=' read -r key value
  do
    if [ ${key} == "region" ] ; then
        #find the first region - this is naiive
        AWS_REGION=${value}
        break
    fi
  done < "$awsFile"
else
  echo "$awsFile Not Found. Couldn't Read AWS Properties"
  exit 1
fi

#strip white spaces
AWS_REGION=$(echo $AWS_REGION | xargs)
#store to .settings
echo "AWS_REGION=$AWS_REGION">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS

#------------------

echo -e "Amazon AWS Account Number:"
read pAccountNo

if [ "$pAccountNo" != "" ] ; then
    AWS_ACCOUNT=$pAccountNo
else
    echo -e "No Account Number entered."
    exit 1
fi

#store to .settings
echo "AWS_ACCOUNT=$AWS_ACCOUNT">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS

echo -e "#### Using $AWS_REGION as AWS Region"

#------------------

echo -e "Enter a Stage (Default is dev, Typical Stages are prod,test,qa):"
read pStage

if [ "$pStage" != "" ] ; then
    AWS_API_STAGE=$pStage
fi

echo -e "#### Using $AWS_API_STAGE as API Stage"
#store to .settings
echo "AWS_API_STAGE=$AWS_API_STAGE">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS

#------------------

echo -e "Enter a S3 Identifier (Default with be a random hash. Typical Identifiers can be something like Your Username):"
read pS3Ident

if [ "$pS3Ident" != "" ] ; then
    AWS_S3_IDENTIFIER=$pS3Ident
else
	THING_ID_STR=$(cat /etc/machine-id)
	#extract a 5 char length from thing id
	THING_ID_LENGTH=$(echo -n $THING_ID_STR | wc -c)
	IDX=$(expr $THING_ID_LENGTH - 5)
	AWS_S3_IDENTIFIER=$(echo $THING_ID_STR | cut -c$IDX-$THING_ID_LENGTH)
	
fi

#convert to lowercase
AWS_S3_IDENTIFIER=$(echo $AWS_S3_IDENTIFIER | tr "[:upper:]" "[:lower:]")

echo -e "#### Using $AWS_S3_IDENTIFIER as S3 Identifier"
#store to .settings
echo "AWS_S3_IDENTIFIER=$AWS_S3_IDENTIFIER">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS

#------------------

if [ -d "$BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION" ]; then
    
    #reset the path
    cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION
    
#------------------
    
    echo -e "***Creating Config for Arrow and AWS..."
    
	cd config

	#use a different delimiter
    sed -e "s#__aws_region__#$AWS_REGION#g" -e "s#__aws_accountNumber__#$AWS_ACCOUNT#g" -e "s#__aws_registryDir__#$ARROW_CERT_DIR#g" index-template.js > index.js
    
    #reset the path
    cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION
    
#------------------

	echo -e "***Creating Amazon IAM and IoT Elements..."
	#Create IAM and IoT Elements
	cd admin
	npm install ../config
	npm install
	node lib/foundation.js create

	#reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION

#------------------

	echo -e "***Modifying Amazon lambda functions..."
	#Lambda function management
	cd lambda
    export NODE_PATH=lib
    
	npm install ../config
	npm install -g grunt-cli
	npm install
	grunt create

	###do a check
	#aws lambda list-functions --query 'Functions[?FunctionName.contains(@, `$ARROW_APP_SEARCH_NEEDLE`)]'
	
	#reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION

#------------------

	echo -e "***Configuring Amazon API gateway..."
	#get the extension
	#TODO (gtam): find a way to insert shell var into aws 
	EXT_INPUT=$(aws iam list-roles --query 'Roles[?RoleName.contains(@, `DragonSense-ApiGateway`)].RoleName' --output text)

    for i in $(echo $EXT_INPUT | tr "-" "\n")
    do
        #this is kind of a hack, since we only need the last one
        #TODO (gtam) : make nicer
        AWS_API_EXTENSION="$i"
    done

    echo -e "#### Detected $AWS_API_EXTENSION as API Gateway Extension"
    #store to .settings
    echo "AWS_API_EXTENSION=$AWS_API_EXTENSION">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS
    
	#api configuration
	cd api

	sed -e "s#__aws_region__#$AWS_REGION#g" -e "s#__aws_accountNumber__#$AWS_ACCOUNT#g" -e "s#__aws_ext__#$AWS_API_EXTENSION#g" $ARROW_APP_NAME-template.yaml > $ARROW_APP_NAME.yaml
	java -jar lib/aws-apigateway-importer.jar --create --deploy $AWS_API_STAGE $ARROW_APP_NAME.yaml

	###do a check
	#aws apigateway get-stage --rest-api-id $(aws apigateway get-rest-apis --query 'items[?name.contains(@, `$ARROW_APP_SEARCH_NEEDLE`)].id' --output text) --stage-name $AWS_API_STAGE
    
	#reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION

#------------------

	echo -e "***Configuring Dashboard on S3..."
    cd ui/content/js
	#get the api identifier
	#TODO (gtam): find a way to insert shell var into aws 
	IDENTIFIER_INPUT=$(aws apigateway get-rest-apis --query 'items[?name.contains(@, `DragonSense`)].id' --output text)
    
    #there could be multiple, take the first one
    AWS_API_IDENTIFIER=$(echo $IDENTIFIER_INPUT | tr -s ' ' | cut -d ' ' -f 1)
    
    #build the aws gateway?
    AWS_API_GATEWAY="https://$AWS_API_IDENTIFIER.execute-api.$AWS_REGION.amazonaws.com/$AWS_API_STAGE"
    
    echo -e "#### Detected $AWS_API_IDENTIFIER as API Gateway Identifier"

    #store to .settings
    echo "AWS_API_IDENTIFIER=$AWS_API_IDENTIFIER">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS
    echo "AWS_API_GATEWAY=$AWS_API_GATEWAY">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS

    sed -e "s#__aws_api_gateway__#$AWS_API_GATEWAY#g" config_template.js > config.js
    
    #reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION
    cd ui/content
    
	aws s3 mb s3://$ARROW_APP_NAME-$AWS_S3_IDENTIFIER
	aws s3 cp --recursive . s3://$ARROW_APP_NAME-$AWS_S3_IDENTIFIER
    
	#reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION

#------------------
   
    echo -e "***Configuring Bucket Policy on S3..."
    cd ui/policy
     
    #modify the policy
    AWS_S3_ARN="arn:aws:s3:::$ARROW_APP_NAME-$AWS_S3_IDENTIFIER/*"
    
    #store to .settings
    echo "AWS_S3_ARN=$AWS_S3_ARN">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS
    
    sed -e "s#__aws_s3_identifier__#$AWS_S3_ARN#g" bucket-policy-template.json > bucket-policy.json

	aws s3api put-bucket-policy --bucket $ARROW_APP_NAME-$AWS_S3_IDENTIFIER --policy file://bucket-policy.json
	aws s3 website s3://$ARROW_APP_NAME-$AWS_S3_IDENTIFIER --index-document index.html

	#reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION

#------------------

	echo -e "***Provisioning a Thing..."
	cd admin
	THING_ID=$(cat /etc/machine-id)
	export THING_ID=$THING_ID
	node lib/things.js create $THING_ID
    
	echo -e "#### Detected $THING_ID as Thing ID"

    #store to .settings
    echo "THING_ID=$THING_ID">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS

	#reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION

#------------------

	echo -e "***Installing Certificates for the Device..."
	cd DragonBoard/certs
	cp $ARROW_CERT_DIR/$THING_ID/aws.{key,crt} .

    #reset the path
    cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION

#------------------

    echo -e "***Building Client..."
    
    cd DragonBoard
    
    cd src
    sed -e "s#__aws_region__#$AWS_REGION#g" -e "s#__aws_registryDir__#$ARROW_CERT_DIR#g" config_template.js > config.js
    cd ..
    
    npm install

#------------------
	
echo -e "################################################"
echo -e "# Build Complete       "
echo -e "################################################"

    #build s3 path
    APP_S3_PATH="http://$ARROW_APP_NAME-$AWS_S3_IDENTIFIER.s3-website-$AWS_REGION.amazonaws.com"
    
    #store to .settings
    echo "APP_S3_PATH=$APP_S3_PATH">>$ARROW_SCRIPTS_DIR/$ARROW_INSTALLER_SETTINGS

    echo -e "#### Access your $ARROW_APP_SEARCH_NEEDLE API Gateway here: $AWS_API_GATEWAY"
	echo -e "#### Access your $ARROW_APP_SEARCH_NEEDLE Dashboard here: $APP_S3_PATH"

#------------------

else
  echo "Please make sure the directory '$BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION' is accesible"
fi