module.exports = function(grunt) {

    // use `msginit -i my-text.pot -l <ll_CC> -o my-text-<ll_CC>.po` to start new translations

    grunt.registerMultiTask('msgmerge', function() {

        var options = this.options({
            text_domain: 'messages',
            template: './',
        });

        if( grunt.file.isDir(options.template) ) {
            options.template = options.template.replace(/\/$/, '') + '/' + options.text_domain + '.pot';
        }

    	if( !grunt.file.exists(options.template) ) {
            grunt.fail.warn('Template file not found: ' + options.template, 3);
        }

        grunt.verbose.writeln('Template: ' + options.template);

    	var done = this.async();
        var counter = this.files.length;

        this.files.forEach(function(file) {

            grunt.util.spawn( {
    	        cmd: 'msgmerge',
        	    args: ['-U', file.src, options.template]
    	    }, function(error, result, code) {

    		    grunt.verbose.write('Updating: ' + file.src + ' ...');

        		if (error) {
        			grunt.verbose.error();
        		} else {
        		    grunt.verbose.ok();
        		}

        		counter--;

        		if (error || counter === 0) {
        			done(error);
        		}

	        });

	    });

    });

};
