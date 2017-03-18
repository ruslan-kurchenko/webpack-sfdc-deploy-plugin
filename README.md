Webpack SFDC Deploy Plugin
===================
[![npm version](https://badge.fury.io/js/webpack-sfdc-deploy-plugin.svg)](https://badge.fury.io/js/webpack-sfdc-deploy-plugin)
[![Dependency Status](https://david-dm.org/henko-okdev/webpack-sfdc-deploy-plugin.svg)](https://david-dm.org/henko-okdev/webpack-sfdc-deploy-plugin) 
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard) 
[![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)]()

[![NPM](https://nodei.co/npm/webpack-sfdc-deploy-plugin.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/webpack-sfdc-deploy-plugin/)

This is a [webpack](http://webpack.github.io/) plugin that simplifies deploying Salesforce static resources.
The most common use case is when you are working on [SPA](https://en.wikipedia.org/wiki/Single-page_application) using modern JavaScript frameworks and want to deploy the bundle 
right after it was built. 

It is great to use the plugin with Webpack `--watch` parameter to deploy the application
right after Webpack has updated it.

Maintainer: Ruslan Kurchenko [@henkookdev](https://twitter.com/henkookdev)

Installation
------------
Install the plugin with npm:
```shell
$ npm install webpack-sfdc-deploy-plugin --save-dev
```

Usage
-----------

The plugin depends on useful JavaScript library that help to work with Salesforce API - [jsforce](https://www.npmjs.com/package/jsforce).    
To successfully deploy your resources to Salesforce you need to provide credentials.   

Create a `.js` file with next format:
```javascript
module.exports = {
    username:   '<user@name.com>',
    password:   '<password>',
    token:      '<security token>'
};
```

> How to get a security token for your Salesforce org you can see [here](https://help.salesforce.com/articleView?id=user_security_token.htm)

#### Configuration

You need pass a hash of configuration options to `SfdcDeployPlugin`.     
Required values are as follows:
- `credentialsPath`: The relative path to `.js` file with credentials to you Salesforce org.
- `filesFolderPath`: The relative path to the folder where placed files that need to be deployed.
- `staticResourceName`: The title name that will be used for creating/updating the `StaticResource` on Salesforce org side.

#### Basic deploy
```javascript
var path = require('path');
var SfdcDeployPlugin = require('webpack-sfdc-deploy-plugin');
var webpackConfig = {
  entry: 'index.js',
  output: {
    path: 'dist',
    filename: 'bundle.js'
  },
  plugins: [
      new SfdcDeployPlugin({
          credentialsPath: path.resolve(__dirname, 'sfdc-org-config.js'),
          filesFolderPath : path.resolve(__dirname, 'dist'),
          staticResourceName : 'AwesomeApplication'         
      })
  ]
};
```

This will create/update `StaticResource` with the name AwesomeApplication including all files that are in the `dist` folder
using Salesforce credentials that are placed in `sfdc-org-config.js` file.

#### Additional options

The plugin has next optional configuration:
- `exclude`: The array of Strings/RegExp to exclude files from deploying.
- `include`: The array of Strings/RegExp to include only certain files to deploying. This option overrides `exclude` configuration.
- `srcFolderPath`: The relative path to the _src_ folder with Salesforce project metadata. If this option provided the plugin will search for old version of static resource and replace it with a newly bundled. (search for _`srcFolderPath`/staticresources/`staticResourceName`_)

> Also, you can provide only String/RegExp instead of array - `exclude: 'vendors.bundle.js'`

Examples:
- To exclude all JavaScript map files: `exclude: /.js.map/`
- You can mix full file names with RegExp: `exclude: ['vendor.bundle.js', /.js.map/]`

# Future plans
- The ability to deploy folders that are placed in deployment folder, for example - `asset` folder 
- The option to use Salesforce `Tooling API` instead of `Matadata API`
- The option to see logs about deployment process

# Contribution

You're free to contribute to this project by submitting [issues](https://github.com/henko-okdev/webpack-sfdc-deploy-plugin/issues) and/or [pull requests](https://github.com/henko-okdev/webpack-sfdc-deploy-plugin/pulls). 
This project uses the [semistandard code style](https://github.com/Flet/semistandard).

# License

This project is licensed under [MIT](https://github.com/henko-okdev/webpack-sfdc-deploy-plugin/blob/master/LICENSE).