#!/bin/bash
SCRIPTPATH=$( cd $(dirname $0) ; pwd -P )

BASE_DRAGONBOARD_DIR="/home/linaro/Documents"
DEFAULT_REGISTRY_DIR="registry"
ARROW_DIR="arrow"
ARROW_APPLICATION="aws-iot-dragonsense-js"
ARROW_APP_SEARCH_NEEDLE="DragonSense"
ARROW_APP_NAME="dragonsense"
ARROW_INSTALLER_SETTINGS=".settings"
AWS_S3_IDENTIFIER=""

echo -e "################################################"
echo -e "# Welcome to Arrow's $ARROW_APP_SEARCH_NEEDLE for Amazon AWS       "
echo -e "#    This script will uninstall and cleanup resources in Amazon"
echo -e "################################################"

#if settings exist - we can use that
#otherwise ask for the s3-identifier

if [ -d "$BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION/scripts" ]; then
    #load the settings from previous install
    . ./$ARROW_INSTALLER_SETTINGS
else
    echo -e "***Could Not Find Previous Installed Settings"
    #ask for s3 identifier
    echo -e "Enter the previous S3 Identifier (Typical Identifiers can be something like Your Username):"
    read pS3Ident

    if [ "$pS3Ident" != "" ] ; then
        AWS_S3_IDENTIFIER=$pS3Ident
        #convert to lowercase
        AWS_S3_IDENTIFIER=$(AWS_S3_IDENTIFIER,,)
    else
        echo -e "No S3 Identifier entered."
        exit 1
    fi
fi

echo -e "CAUTION: THIS WILL REMOVE ALL RESOURCES RELATED TO $ARROW_APP_SEARCH_NEEDLE FROM YOUR AMAZON ACCOUNT."
echo -e "type YES , if you want to continue"
read pRemove

if [ "$pRemove" == "YES" ] ; then

    if [ -d "$BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION" ]; then
        
        #reset the path
        cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION
        
    #------------------

        echo -e "***Removing Amazon IAM and IoT Elements..."
        cd admin
        node lib/foundation.js delete
        
        #reset the path
        cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION

    #------------------
        
        echo -e "***Removing Amazon lambda functions..."
        cd lambda
        export NODE_PATH=lib
        grunt delete
        
        #reset the path
        cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION
        
     #------------------
        
        echo -e "***Removing Amazon API gateway..."
        
        API_LIST=$(aws apigateway get-rest-apis --query 'items[?name.contains(@, `DragonSense`)].id' --output text)
        for i in $(echo $API_LIST | tr  -s ' ')
        do
             echo -e "deleting $i ..."
             aws apigateway delete-rest-api --rest-api-id $i
        done
        
        #reset the path
        cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION

     #------------------
        
        echo -e "***Removing Bucket from S3..."
        aws s3 rm s3://$ARROW_APP_NAME-$AWS_S3_IDENTIFIER --recursive

     #------------------

        echo -e "***Removing the Thing..."
        cd admin
        node lib/things.js delete $THING_ID
     
     #------------------

     echo -e "################################################"
     echo -e "# Uninstall and Cleanup Complete               #"
     echo -e "################################################"
        
    else
      echo "Please make sure the directory '$BASE_DRAGONBOARD_DIR/$ARROW_DIR/$ARROW_APPLICATION' is accesible"
    fi
else
  echo -e "***Uninstall Cancelled."  
fi