"use strict";

const fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    jsforce = require('jsforce'),
    Zip = require('node-zip');

class WebpackSfdcDeployPlugin {

    constructor(options) {
        this.errors = [];

        this.options = options || {};
        this.options.deploy = options.deploy || true;

        if(!this.options.filesFolderPath) {
            this.errors.push('"filesFolderPath" is required!');
        }
        if(!this.options.staticResourceName) {
            this.errors.push('"staticResourceName" is required!');
        }

        try {
            this.options.forceComConfig = require(options.credentialsPath);
        } catch (e) {
            this.errors.push('Salesforce.com credentials was not found by specified URL: ' + options.credentialsPath);
        }
    }

    apply(compiler) {
        if (this.errors.length) {
            this.printErrors();
            return;
        }

        const dir = this.options.filesFolderPath;

        compiler.plugin('done', stats => {
            if (stats.hasErrors()) {
                this.printErrors(stats.compilation.errors);
                return;
            }
            this.prepareFileValidation();

            fs.readdir(dir, (err, files) => {
                if (err) {
                    this.printErrors(err);
                }

                const resourceZip = new Zip();
                files.forEach(fileName => {
                    if(this.validateFile(fileName)) {
                        const data = fs.readFileSync(path.resolve(dir, fileName), 'utf8');
                        resourceZip.file(fileName, data);
                    }
                });

                if (this.options.deploy) {
                    this.deploy(resourceZip);
                }
            });

        });
    }

    deploy(resourceZip) {

        const payload = [];

        if (resourceZip.file(/./g).length > 0) {
            payload.push({
                fullName: this.options.staticResourceName,
                content: resourceZip.generate({base64: true, compression: 'DEFLATE'}),
                contentType: 'application/zip',
                cacheControl: this.options.isPublic ? 'Public' : 'Private'
            });

            if(this.options.srcFolderPath) {
                this.replaceSrcStaticResource(resourceZip);
            }
        }

        const conn = new jsforce.Connection({loginUrl: this.options.forceComConfig.url || 'https://login.salesforce.com'});
        const username = this.options.forceComConfig.username;
        const password = this.options.forceComConfig.password + (this.options.forceComConfig.token ? this.options.forceComConfig.token : '');

        conn.login(username, password, (err) => {
            if (err) throw err;

            conn.metadata.upsert('StaticResource', payload, (err, results) => {
                if (err) {
                    console.log(err);
                    return;
                }

                WebpackSfdcDeployPlugin.printResult(results);
            });
        });
    }

    replaceSrcStaticResource(resourceZip) {
        const staticResourcePath = path.resolve(this.options.srcFolderPath, 'staticresources/' + this.options.staticResourceName + '.resource');
        const data = resourceZip.generate({type: 'nodebuffer', compression: 'DEFLATE'});
        fs.writeFile(staticResourcePath, data, 'binary', (err) => {
            if(err) this.printErrors(err);
        });
    }

    printErrors(errors) {
        if(errors && errors.length) {
            this.errors.concat(errors);
        }

        this.errors.forEach(err => { console.error('ERROR: ' + err); });
    }

    prepareFileValidation() {
        const includeValidators = WebpackSfdcDeployPlugin.formatValidationArrays(this.options.include);
        const excludeValidators = WebpackSfdcDeployPlugin.formatValidationArrays(this.options.exclude);
        const validate = !!(includeValidators.length || excludeValidators.length);
        const include = includeValidators.length > 0;
        const validators = include ? includeValidators : excludeValidators;

        this.fileValidation = {
            validate: validate,
            include: include,
            validators: validators
        }
    }

    validateFile(fileName) {
        return this.fileValidation.validators.length
            ? !!this.fileValidation.validators.find(exp => _.isRegExp(exp)
                ? fileName.search(exp) > -1 === this.fileValidation.include
                : (exp === fileName) === this.fileValidation.include)
            : true;
    }

    static formatValidationArrays(validators) {
        return _.isArray(validators) ? validators : (!!validators ? [ validators ] : []);
    }

    static printResult(results) {
        const delimiter = '======================================================';
        const successMsg = delimiter + '\nThe Static Resource: "' + results.fullName + '" was successfully ';
        if (results.created && results.success) {
            console.log(successMsg + 'created!\n' + delimiter);
        } else if (results.success) {
            console.log(successMsg + 'updated!\n' + delimiter);
        } else {
            console.log(results);
        }
    }
}

module.exports = WebpackSfdcDeployPlugin;
