import gulp from 'gulp';
import gulpZip from 'gulp-zip';
import gulpUnzip from 'gulp-unzip';
import gulpClean from 'gulp-clean';
import path from 'path';
import fileExists from 'file-exists';
import { pathExists } from 'path-exists';
import xmlEdit from 'gulp-edit-xml';
import split from 'split-string';

const SOURCE_DIR = process.cwd();
const WORKING_DIR = process.env.INIT_CWD;

// directory where mods are copied to for testing
const TESTING_DIR = path.join(SOURCE_DIR, 'testing','GitHub')

// directory where mod folders are copied to for use in the Giants testrunner tool.
const GIANTS_DIR = path.join(SOURCE_DIR, 'Giants', 'test')

// handle incoming args
const arg = (arglist => {
    let arg = {}, a, opt, thisOpt, curOpt;
    for (a = 0; a < arglist.length; a++) {
        thisOpt = arglist[a].trim();
        opt = thisOpt.replace(/^\-+/, '');
        if (opt === thisOpt) {
            if (curOpt) arg[curOpt] = opt;
            curOpt = null;
        } else {
            curOpt = opt;
            arg[curOpt] = true;
        }
    }
    return arg;
})(process.argv);


const getModFolder = () => {
    let modFolder = '';
    if (arg.mod) {
        const dir = arg.mod.replace(/([.\\*\\\\/])/ig, '')
        modFolder = dir;
        const sourceModFolder = path.join(SOURCE_DIR, modFolder)
        const workingModFolder = path.join(WORKING_DIR, modFolder)
        if (fileExists.sync(path.join(sourceModFolder, "modDesc.xml"))) {
            return sourceModFolder;
        } else if (fileExists.sync(path.join(workingModFolder, "modDesc.xml"))) {
            return workingModFolder;
        }

        throw new Error(`Unable to find modfolder: ${modFolder}`);
    }
    
    if (!fileExists.sync(path.join(WORKING_DIR, "modDesc.xml"))) {
        throw new Error('Invalid mod folder, missing modDesc.xml');
    }

    return WORKING_DIR;
}

const getModFolderName = () => {
    return path.basename(getModFolder());
}

const getZipFilename = () => {
    return path.basename(getModFolder()) + '.zip';
}

const getZipFilePath = () => {
    return path.join(getModFolder(), getZipFilename());
}

const getCopyDest = (internalFolder) => {
    let copyDest = TESTING_DIR;
    if (internalFolder) {
        copyDest = path.join(SOURCE_DIR, internalFolder);
    } else if (arg.dest) {
        copyDest = arg.dest;
    }
    return copyDest;
}

const getGiantsTestFolder = () => {
    return getCopyDest(GIANTS_DIR);
}

const bumpGiantsVersion = (oldVersion, bumpType) => {

    if (arg.debug) {
        console.log('-- oldVersion: ', oldVersion);
    }

    //...Split the version number string into elements so you can bump the one you want
    var vArray = split(oldVersion);
    if (bumpType == 'release') {
        vArray[0] = parseInt(vArray[0], 10) + 1;
        vArray[1] = 0;
        vArray[2] = 0;
        vArray[3] = 0;
    } else if (bumpType == 'major') {
        vArray[1] = parseInt(vArray[1], 10) + 1;
        vArray[2] = 0;
        vArray[3] = 0;
    } else if (bumpType == 'minor') {
        vArray[2] = parseInt(vArray[2], 10) + 1;
        vArray[3] = 0;
    } else if (bumpType == 'patch') {
        vArray[3] = parseInt(vArray[3], 10) + 1;
    } else {
        return oldVersion;
    } 

    const newVersion = vArray.join('.');
    if (arg.debug) {
        console.log('-- newVersion: ', newVersion)
    }

    return newVersion;
}

/**
 * bump the version number as part of the update
 * @returns success
 */
const bump = () => {
    const modFolder = getModFolder()
    const modDesc = path.join(modFolder, "modDesc.xml");
    
    let bumpType = 'patch';
    if (arg.ver) {
        bumpType = arg.ver;
    }

    if (arg.debug) {
        console.log('-- bumpType: ', bumpType)
    }
    
    const stripWindowsNewlines = function(value, name) {
        return value.replace(/\r\n/g, '\n');
    };
    const options = {
        parserOptions: {
            valueProcessors: [stripWindowsNewlines]
        },
        builderOptions: {
            headless: false,
            renderOpts: {
                pretty: true,
                indent: '    ',
                newline: "\n",                
            },
            cdata: true,
        }
    }

    return gulp.src(modDesc)
        .pipe(xmlEdit((xml) => {
            xml.modDesc.version = bumpGiantsVersion(xml.modDesc.version[0], bumpType);
            return xml;
        }, options))
        .pipe(gulp.dest(modFolder));
};


/**
 * prepare the repo for parsing.
 */
const prepare = () => {

    if (arg.bump) {
        if (arg.debug) {
            console.log ('-- BUMPING VERSION ');
        }
        return bump();
    }

    return Promise.resolve();
}


/**
 * zip the current mod folder into a named zip file inside the same directory
 * @returns success
 */
const zip = () => {
    const modFolder = getModFolder();
    if (arg.debug) {
        console.log ('-- zipping modFolder: ', modFolder)
        console.log ('-- zip filename: ', getZipFilename())
        console.log ('-- creating zip: ', getZipFilePath())
    }
    return gulp.src([ path.join(modFolder, '**', '*.*'), '!{**/*.zip,**/_*,**/_**/**/*,**/_**/*.*}' ])
        .pipe(gulpZip(getZipFilePath()))
        .pipe(gulp.dest(modFolder));
};

/**
 * zip the current mod folder with modhub restrictions into a named zip file inside the same directory
 * @returns success
 */
const zipModHub = () => {
    const modFolder = getModFolder();
    const zipFilePath = getZipFilePath()
    if (arg.debug) {
        console.log('-- zipping modFolder: ', modFolder)
        console.log('-- zip filename: ', getZipFilename())
        console.log('-- creating zip: ', zipFilePath)
    }
    return gulp.src([ path.join(modFolder, '**', '*.*'), '!{**/*.md,**/*.zip,**/_*,**/_**/**/*,**/_**/*.*}' ])
        .pipe(gulpZip(zipFilePath))
        .pipe(gulp.dest(modFolder));
};

/**
 * copy the zipped up file to the a specified directory
 * @returns success
 */
const copy = () => {
    const copySrc = path.join(getModFolder(), getZipFilename());
    const copyDest = getCopyDest();
    if (arg.debug) {
        console.log ('-- copying zip to ', copyDest, getZipFilename())
    }
    return gulp.src(copySrc)
        .pipe(gulp.dest(copyDest));
};

/**
 * copy the zipped up file to testing directory
 * @returns success
 */
const copyTesting = () => {
    const copySrc = getZipFilePath();
    const copyDest = getGiantsTestFolder();
    const copyDestFilename = path.join(copyDest, getModFolderName());
    if (arg.debug) {
        console.log('-- copying zip to ', copyDest, copyDestFilename)
    }
    return gulp.src(copySrc)
        .pipe(gulp.dest(copyDest))
        .pipe(gulpUnzip())
        .pipe(gulp.dest(copyDestFilename));
};

/**
 * remvoe the giants testing folder before unzipping again to make sure it's the latest version
 * @returns success
 */
const removeTestFolder = () => {
    const copyDest = getGiantsTestFolder();
    const modFolder = getModFolder()
    const destinationFolder = path.join(copyDest, modFolder)
    if (arg.debug) {
        console.log('-- rempoving test folder ', destinationFolder)
    }
    if (!pathExists.sync(destinationFolder)) {
        if (arg.debug) {
            console.log('!! folder does not exist, exiting.', destinationFolder)
        }
        return Promise.resolve();
    }
    return gulp.src(destinationFolder)
        .pipe(gulpClean({ force: true }))
};

const removeTestFile = () => {
    const copyDest = getGiantsTestFolder();
    const zipFilePath = getZipFilePath();
    if (arg.debug) {
        console.log ('-- removing test zip ', zipFilePath)
    }
    if (!fileExists.sync(zipFilePath)) {
        if (arg.debug) {
            console.log ('!! file does not exist, exiting.', zipFilePath)
        }
        return Promise.resolve();
    }
    return gulp.src(zipFilePath)
        .pipe(gulpClean({ force: true }))
};

const build = gulp.series(prepare, zip, copy);

const testRun = gulp.series(prepare, zipModHub, removeTestFolder, removeTestFile, copyTesting);

export {
    zip,
    zipModHub,
    copy,
    build,
    testRun,
    copyTesting,
    removeTestFolder,
    removeTestFile,
    bump,
};

export default build;
