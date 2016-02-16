
// discoveryDelay = 750ms artificial delay - this is probably dependent on how fast one can establish a connection to aws

var config = {
    maxSensors:2,
    discoveryTime:15000, //ms
    discoveryDelay:750, //ms
    sensorRefresh:2, //sec
    sensorDelay:1000, //ms
    roundRobin:true,
    awsConfig:{
        certificatePath:'__aws_registryDir__',
        privateKey:'aws.key',
        pemCertificate:'aws.crt',
        rootCertificate:'rootCA.crt',
        region:'__aws_region__'
    }
};

module.exports = config;