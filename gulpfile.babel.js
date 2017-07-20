'use strict';

// utilities
import { argv } from 'yargs';
import assign from 'lodash.assign';
import del from 'del';
import fs from 'fs';
import path from 'path';
import pckg from './package.json';
import _ from 'lodash';

// gulp things
import gulp from 'gulp';
import lazypipe from 'lazypipe';
import plugins from 'gulp-load-plugins';

const $ = plugins({ scope: ['devDependencies'] });

// metalsmith things
import gulpsmith from 'gulpsmith';
import debug from 'metalsmith-debug';
import permalinks from 'metalsmith-permalinks';
import rename from 'metalsmith-rename';
import robots from 'metalsmith-robots';
import rootPath from 'metalsmith-rootpath';
import sitemap from 'metalsmith-sitemap';
import partials from 'metalsmith-jstransformer-partials';
import inPlace from 'metalsmith-in-place';
import layouts from 'metalsmith-layouts';
import openGraph from 'metalsmith-open-graph';
import helpers from 'metalsmith-register-helpers';
import inlineSource from 'metalsmith-inline-source';

// post css things
import autoprefixer from 'autoprefixer';
import rucksack from 'rucksack-css';

import chromatic from 'chromatic-sass';

const domainName = 'ojai.kammok.com';
const PRODUCTION = !!(argv.env === 'production');
const PATH = {
    output: (PRODUCTION) ? 'dist/' : '.dev/',
    source: {
        templates: [
            'source/layouts/**/*.hbs',
            'source/partials/**/*.hbs'
        ],
        pages: [
            'source/pages/**/*.hbs'
        ],
        images: [
            'source/**/*.{jpg,png,svg,gif}'
        ],
        styles: [
            'source/**/*.scss'
        ],
        scripts: [
            'source/**/*.js'
        ],
        misc: [
            'source/images/favicon*'
        ]
    }
};

gulp.task('build:pages', ['build:images', 'build:scripts'], () => {
    return gulp.src(PATH.source.pages)
        .pipe($.plumber())
        .pipe($.frontMatter()
            .on('data', function(file) {
                file.version = pckg.version;
                assign(file, file.frontMatter);
                delete file.frontMatter;
            })
        )
        .pipe(gulpsmith()
            .metadata({ PRODUCTION: PRODUCTION })
            .use(helpers({
                directory: 'helpers/'
            }))
            .use(rename([ [/\.hbs$/, '.html'] ])) // convert .hbs to .html for permalinks()
            .use(permalinks())
            .use(rootPath())
            .use(rename([ [/\.html$/, '.hbs'] ])) // convert .html to .hbs for js-transformer
            .use(layouts({
                'cache': false,
                'engine': 'handlebars',
                'directory': 'source/layouts/',
                'default': 'page.hbs',
                'partials': 'source/partials/',
                'partialExtension': '.hbs',
                'rename': false
            }))
            .use(inPlace({
                'engineOptions': {
                    'cache': false
                }
            }))
            .use(inlineSource({
                compress: false,
                rootpath: PATH.output
            }))
            .use(rename([ [/\.hbs$/, '.html'] ])) // convert .hbs to .html for final output
            .use(openGraph({
                sitetype: 'website',
                siteurl: `https://${domainName}`,
                title: 'title',
                description: 'description',
                image: 'ogImage'
            }))
            .use(sitemap({ hostname: `https://${domainName}` }))
            .use(robots({ sitemap: `https://${domainName}/sitemap.xml` }))
        )
        .pipe(gulp.dest(PATH.output));
});

gulp.task('build:styles', ['build:pages'], () => {
    const productionTasks = lazypipe()
        .pipe($.base64, {
            extensions: ['svg', 'png', /\.jpg#datauri$/i],
            maxImageSize: 8*1024, // bytes
            debug: false
        })
        .pipe($.postcss, [
            autoprefixer({ browsers: ['last 2 version', '> 5%'] })
        ])
        .pipe($.uncss, {
            html: ['dist/**/*.html'],
            ignore: [/(balloon).*/, /(slick).*/]
        })
        .pipe($.groupCssMediaQueries)
        .pipe($.cssnano, { discardComments: { removeAll: true } })
        .pipe($.rename, { suffix: '.min.' + pckg.version })

    return gulp.src(PATH.source.styles)
        .pipe($.plumber())
        .pipe($.sass({
            functions: chromatic,
            outputStyle: 'expanded',
            sourceComments: true,
            includePaths: [
                'source/styles/',
                'source/layouts/',
                'source/partials/',
                'source/pages/',
                'node_modules/'
            ]
        }))
        .pipe($.postcss([
            rucksack()
        ]))
        .pipe($.if(PRODUCTION, productionTasks(), $.util.noop()))
        .pipe(gulp.dest(PATH.output));
});

gulp.task('build:scripts', () => {
    const productionTasks = lazypipe()
        .pipe($.uglify)
        .pipe($.rename, { suffix: '.min.' + pckg.version })

    return gulp.src('source/scripts/site.js')
        .pipe($.plumber())
        .pipe($.betterRollup({
            globals: {}
        }, {
            format: 'iife'
        }))
        .pipe($.babel({ presets: ['es2015'] }))
        .pipe($.if(PRODUCTION, productionTasks(), $.util.noop()))
        .pipe(gulp.dest(`${PATH.output}scripts/`));
});

gulp.task('build:modernizr', () => {
    const productionTasks = lazypipe()
        .pipe($.uglify)
        .pipe($.rename, { suffix: '.min.' + pckg.version })

    return gulp.src(PATH.source.scripts)
        .pipe($.plumber())
        .pipe($.modernizr())
        .pipe($.if(PRODUCTION, productionTasks(), $.util.noop()))
        .pipe(gulp.dest(`${PATH.output}scripts/`));
});

gulp.task('build:images', () => {
    const productionTasks = lazypipe()
        .pipe($.imagemin, { use: ['mozjpeg', 'pngquant', 'svgo'] })

    return gulp.src(PATH.source.images)
        .pipe($.plumber())
        .pipe($.changed(PATH.output))
        .pipe($.if(PRODUCTION, productionTasks(), $.util.noop()))
        .pipe(gulp.dest(PATH.output));
});

gulp.task('build:misc', () => {
    return gulp.src(PATH.source.misc)
        .pipe($.plumber())
        .pipe(gulp.dest(PATH.output));
});

// Copy main files from package.json dependencies.
// This task requires the `styles` task to be
// completed first, otherwise uncss() will look
// in the /node_modules/ directory to do its thing
gulp.task('build:vendor', ['build:styles'], () => {
    return gulp.src($.npmFiles(), { base: './' })
        .pipe($.plumber())
        .pipe(gulp.dest(PATH.output));
});

gulp.task('clean', () => {
    del.sync([PATH.output]);
});

gulp.task('compile', ['clean', 'build'], () => {
    return gulp.src([`${PATH.output}/**/*.html`, `!${PATH.output}/node_modules/**`])
        .pipe($.plumber())
        .pipe($.base64({
            baseDir: 'dist/images/',
            extensions: ['svg', 'png', /\.jpg#datauri$/i],
            maxImageSize: 8*1024,
            deleteAfterEncoding: false,
            debug: false
        }))
        .pipe($.htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest(PATH.output));
});

gulp.task('webserver', ['build'], () => {
    return gulp.src(PATH.output)
        .pipe($.plumber())
        .pipe($.webserver({
            livereload: true,
            port: 1111,
            open: false
        }));
});

gulp.task('build', [
    'build:images',
    'build:pages',
    'build:styles',
    'build:scripts',
    'build:modernizr',
    'build:misc',
    'build:vendor'
]);

// local dev
gulp.task('default', ['build', 'webserver'], () => {
    gulp.watch([PATH.source.pages, PATH.source.templates], ['build:pages']);
    gulp.watch([PATH.source.images],  ['build:images']);
    gulp.watch([PATH.source.styles],  ['build:styles']);
    gulp.watch([PATH.source.scripts], ['build:scripts']);
});

// preview production build
gulp.task('preview', ['compile', 'webserver'], () => {
    gulp.watch([
        PATH.source.pages,
        PATH.source.templates,
        PATH.source.images,
        PATH.source.styles,
        PATH.source.scripts
    ], ['clean', 'compile']);
});
