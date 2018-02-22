---
categories:
- javascript
date: 2014-12-27T00:00:00Z
description: How to set up tests and code coverage for in browser unit tests with blanketjs
redirect_from: javascript/2014/12/27/coverage-with-gulp-phantom-and-mocha.html
tags:
- gulp
- mocha
- phantomjs
- blanketjs
title: Coverage with gulp, phantom and mocha
---

Setting up code coverage for javascript can prove troublesome, especially when testing in the browser.

In this post I will show you how to use [blanketjs](http://blanketjs.org/), a good javascript
code coverage tool.

It's easy to use : it will instrument your code automatically, it provides adapters for the main javascript test frameworks (mocha, qunit, jasmine) and it does work with browser testing.

## TL;DR

If you want to fiddle with the code, go directly to [github](https://github.com/geowarin/javascript-coverage).

To enable in-browser testing with gulp, we will use [gulp-mocha-phantomjs](https://github.com/mrhooray/gulp-mocha-phantomjs) which leverages [mocha-phantomjs](https://github.com/metaskills/mocha-phantomjs).

Mocha phantomjs redirects all output to the console and can dump it into a file.

Blanket default reporter for browser testing will output everything to the dom. Our task will essentially consist in overriding this behavior with two reporters you can find in [this gist](https://gist.github.com/geowarin/d86c7ff39ac43ee730a7) so the output goes to the console instead.

## Setting up mocha and phantom with gulp

Basically we will do what the gulp-mocha-phantomjs plugin [instructs us to](https://github.com/mrhooray/gulp-mocha-phantomjs#usage).
We will just tweak the example a little to inject our resources directly with the help of
the [gulp-inject plugin](https://github.com/klei/gulp-inject#gulp-inject---)

Our test index will look like this :

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mocha Test Runner</title>
  <!-- bower:css -->
  <!-- endinject -->
</head>
<body>
  <div id="mocha"></div>
  <!-- bower:js -->
  <!-- endinject -->

  <!-- all:js -->
  <!-- endinject -->

  <script type="text/javascript">
    var assert = chai.assert;
  </script>

  <div id="sandbox"></div>

  <script>mocha.setup('bdd')</script>
  <!-- suites:js -->
  <!-- endinject -->
  <script>
    if (window.mochaPhantomJS) {
      mochaPhantomJS.run();
    } else {
      mocha.run();
    }
  </script>
</body>
</html>
```

You can see we defined a few places where our resources will be injected :

* `bower:css` and `bower:js` will include the stylesheets and code of our bower dependencies
* `all:js` will contain all of our js code
* `suites:js` will contain all of our test suites.

Be sure to `bower install --save-dev` `mocha` and `blanket`, the libraries we will be using.
You can also take a look at [sinon](http://sinonjs.org/) and [chai](http://chaijs.com/), which are must have tools for js testing.

The associated gulpfile :

```javascript
var gulp = require('gulp'),
    inject = require('gulp-inject'),
    bowerFiles = require('main-bower-files'),
    mochaPhantomJS = require('gulp-mocha-phantomjs');


gulp.task('injectIntoIndex', ['processIndex'], function () {
  return gulp.src('test/index.html')
      .pipe(inject(
          gulp.src(bowerFiles({includeDev: true}), {read: false}),
          {name: 'bower', relative: true}
        ))
        .pipe(inject(
          gulp.src(['src/js/**/*.js'], {read: false}),
          {name: 'all', relative: true}
        ))
        .pipe(inject(
          gulp.src(['test/suites/**/*.js'], {read: false}),
          {name: 'suites', relative: true}
        ))
        .pipe(gulp.dest('test'));
});

gulp.task('test', ['injectIntoIndex'], function () {
  return gulp.src('test/index.html', {read: false})
    .pipe(mochaPhantomJS());
});

```

At this point, if you launch `gulp test`, you will see the mocha spec report.

## Adding the coverage report

If you want to add a blanket coverage report in the browser straight to the dom
you will do as shown [in this demo](http://alex-seville.github.io/blanket/test/mocha-browser/adapter.html).

First problem with that snippet is that it [doesn't work](https://github.com/alex-seville/blanket/issues/451) with the latest version of mocha. Somebody fixed it [here](https://github.com/vladikoff/mocha-blanketjs-adapter/blob/master/mocha-blanket.js) if you're interested.

Our goal is pretty similar to that. We will define a mocha reporter inside mocha-phantom which will work as an adapter for blanket:

<code data-gist-id="d86c7ff39ac43ee730a7" data-gist-file="mochaBlanketAdapter.js"></code>

Inside the index we will replace the old call to mocha with :

```html
<script>
  if (window.mochaPhantomJS) {
    <!-- @if !coverage -->
    mochaPhantomJS.run();
    <!-- @endif -->

    <!-- @if coverage -->
    blanket.beforeStartTestRunner({
      callback: function(){
        if (!blanket.options("existingRequireJS")){
          mochaPhantomJS.run();
        }
      }
    });
    <!-- @endif -->

  } else {
    mocha.run();
  }
</script>
```

Notice that I use the [gulp-preprocess plugin](https://github.com/jas/gulp-preprocess) to DRY the code.

Our gulp file gets richer :

<code data-gist-id="d86c7ff39ac43ee730a7" data-gist-file="gulpfile.js"></code>

Last thing is to activate blanket coverage. Insert this snippet just after the bower dependencies

```html
<!-- @if coverage -->
<script data-cover-only="src/js"
  data-cover-modulepattern=".*\/js\/(\w+)"
  data-cover-reporter="../build/report/blanketHtmlReporter.js"
  src="../bower_components/blanket/dist/qunit/blanket.js"></script>
<!-- @endif -->
```

* The `data-cover-only` is a string that your js files have to match to be instrumented.
* The `data-cover-modulepattern` is an option to regroup coverage data by module.
* The `data-cover-reporter` will point to our own report.

Basically, it is the same as [the default qunit reporter](https://github.com/alex-seville/blanket/blob/master/src/qunit/reporter.js) but we will output the resulting html to the console rather than to the dom.

The reporter is [available here](https://gist.github.com/geowarin/d86c7ff39ac43ee730a7#file-blankethtmlreporter-js).

## Conclusion

You can now launch `gulp test` which will run the tests and display the mocha spec reporter.
Note that other reports are [available in mocha-phantom](https://github.com/metaskills/mocha-phantomjs#supported-reporters) like the xunit reporter.
This would be a better option in the context of an automated build.

Or you can launch `gulp test --coverage` and it will generate the report to `test/coverage.html` :

![Result](/assets/images/articles/2014-12-coverage-report.png "Coverage html report")

I hope you enjoyed this article, let me know in the comments if the solution works for you.
Next step for me will be generating a better html report.
