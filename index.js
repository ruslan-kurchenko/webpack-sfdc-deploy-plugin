"use strict";

const fs = require('fs'),
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
            this.options.forceComConfig = require(options.credentialsUrl);
        } catch (e) {
            this.errors.push('Salesforce.com credentials was not found by specified URL: ' + options.credentialsUrl);
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

            fs.readdir(dir, (err, files) => {
                if (err) {
                    this.printErrors(err);
                }

                const resourceZip = new Zip();
                files.forEach(file => {
                    const data = fs.readFileSync(dir + file, 'utf8'); // may need to add '/'
                    resourceZip.file(file, data);
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
                cacheControl: 'Private'
            });
        }

        const conn = new jsforce.Connection();
        const username = this.options.forceComConfig.username;
        const password = this.options.forceComConfig.password + this.options.forceComConfig.token;

        conn.login(username, password, (err, res) => {
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

    printErrors(errors) {
        if(errors && errors.length) {
            this.errors.contact(errors);
        }

        this.errors.forEach(err => { console.error('ERROR: ' + err); });
    }

    static printResult(results) {
        const delimiter = '\n======================================================\n';
        const successMsg = delimiter + 'The Static Resource: "' + results.fullName + '" was successfully ';
        if (results.created && results.success) {
            console.log(successMsg + 'created!' + delimiter);
        } else if (results.success) {
            console.log(successMsg + 'updated!' + delimiter);
        } else {
            console.log(results);
        }
    }
}

module.exports = WebpackSfdcDeployPlugin;
