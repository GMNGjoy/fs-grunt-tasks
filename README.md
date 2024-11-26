# fs-grunt-tasks
This set of grunt / gulp tasks is what I use for development of mods, to simplify many of the tasks that I found myself doing over and over. This way, I don't forget to "omit" a file, or don't have to manually zip another mod, ever. These tasks are setup to work for any mod, any version of the game, in *most* any directory structure. 

## Configuration

There are a few variables within the `gulpfile.js` that may need to be updated depending on how you setup your folder structure. Feel free to edit to your liking.

```js
// directory where mods are copied to for testing
const TESTING_DIR = path.join(SOURCE_DIR, 'testing','GitHub')

// directory where mod folders are copied to for use in the Giants testrunner tool.
const GIANTS_DIR = path.join(SOURCE_DIR, 'Giants', 'test')
```

as an example my folder structure is the following:

```
C:/
    Gaming/
        mods/
            FS25_TestMod
        testing/
            GitHub/
        Giants/
            test/
        gulpfile.js
```

Then the resulting values of those two constants would be:

```js
const SOURCE_DIR = "C:.Gaming"

// directory where mods are copied to for testing
const TESTING_DIR = "C:/Gaming/testing/GitHub"

// directory where mod folders are copied to for use in the Giants testrunner tool.
const GIANTS_DIR = "C:/Gaming/Giants/test"
```

Feel free to adjust as you see fit.


## Core Functions

### `build`

```gulp build```

This is the primary build task,  which will `zip` up the mod, and `copy` the mod to the appropriate testing folder.

This command can be run without options from inside a mod directory

```
C:/mods/FS25_TestMod $> gulp build
```


### `testRun`

```gulp testRun```

This is the secondary main build task, which is designed to "prepare a mod for Giants test-runner", and performs the following tasks in order: `prepare`, `zipModHub`, `removeTestFolder`, `removeTestFile`, `copyTesting`; each task is detailed below.


## Singular Commands

### `bump`

This command  automatically "bump" the version number of the mod when it runs by editing your `modDesc.xml`, finding the version number, and intelligently determining what the next version number will be.

```
C:/mods/FS25_TestMod $> gulp bump
```

Since Giants' mods do not support [semver]() but instead run with their own version, for the purposes of this script, I'm considering the versioning to work like this:

```
<releaseVersion>.<majorVersion>.<minorVersion>.<patchVersion>
```

so, as an example this is how you'd break down a typical Giants' version number:

```
1.2.3.4 

releaseVersion: 1
majorVersion:   2
minorVersion:   3 
patchVersion:   4
```

by default, the `bump` command will do a "patch" version bump. 

```
// version: 1.0.0.1
C:/mods/FS25_TestMod $> gulp bump
// version: 1.0.0.2
```

If you'd like to alter (at runtime) which type of version to bump, you can provide the `--ver` option

```
// version: 1.0.0.1
C:/mods/FS25_TestMod $> gulp bump --ver major
// version: 1.1.0.0
```

which will do a major version bump instead (resetting lower versions to 0). the options for `ver` are `release | major | minor | patch`

`bump` can also be run in conjunction with either `build` or `testRun` by providing the `--bump` option, which will happen as part of the `prepare` phase.

```
C:/mods/FS25_TestMod $> gulp build --bump
```


### `zip`

This command will do just as it says - zip the existing mod folder and create a named zip inside the same folder.

The zip command will ignore other zip files, and will ignore any folders named with an underscore at the beginning of the folder name.

If my directory structure is as follows:
```
C:/mods/FS25_TestMod/
    _assets/
        modHubIcon.png
    i3d/
        textures/
           testMod_diffuse.dds
        testMod.i3d
    xml/
        testMod.xml
    modDesc.xml
    README.md
    LICENSE.md
    SomeRandomZip.zip
    FS25_TestMod.zip
```

The resulting named zip, `FS25_TestMod.zip`, will contain everything in that folder except `SomeRandomMod.zip`, `FS25_TestMod.zip`, `modHubIcon.png`, or the `_assets` folder itself.

### `zipModHub`

This command works the same as the `zip` command, but ignores any markdown files.

If my directory structure is as follows:

```
C:/mods/FS25_TestMod/
    _assets/
        modHubIcon.png
    i3d/
        textures/
           testMod_diffuse.dds
        testMod.i3d
    xml/
        testMod.xml
    modDesc.xml
    README.md
    LICENSE.md
    SomeRandomZip.zip
    FS25_TestMod.zip
```

The resulting named zip, `FS25_TestMod.zip`, will contain everything in that folder except `README.md`, `LICENSE.md`, `SomeRandomMod.zip`, `FS25_TestMod.zip`, `modHubIcon.png`, or the `_assets` folder itself.


### `copy`

This command copies the current named zip file from the current mod directory and copies it to the `TESTING_DIR` destination.

```
C:/mods/FS25_TestMod $> gulp copy
```

...and can be used with the `mod`, and `dest` options as you see fit.


### `copyTesting`

This command copies the current named zip file from the current mod directory and copies it to the `GIANTS_DIR` destination.

```
C:/mods/FS25_TestMod $> gulp copyTesting
```

...and can be used with the `mod` option as you see fit.



### `removeTestFolder`

This command removes the current testing folder for the mod in question from `GIANTS_DIR` destination to avoid conflicts and ensure a clean build. it is used as a step in the `testRun` task.

```
C:/mods/FS25_TestMod $> gulp removeTestFolder
```


### `removeTestFile`

This command removes the current testing zip for the mod in question from `GIANTS_DIR` destination to avoid conflicts and ensure a clean build. it is used as a step in the `testRun` task.

```
C:/mods/FS25_TestMod $> gulp removeTestFile
```


## Options

### `mod` 

`--mod`
you can be run any of the above commands outside the mod directory by providing the `mod` option. (trailing spaces will be automatically removed)

```
C:/mods $> gulp build --mod FS25_TestMod/
```


### `ver` 

used exclusively with the `bump` command to alter (at runtime) which type of version to "bump".
the options for `ver` are `release | major | minor | patch`

```
C:/mods/FS25_TestMod $> gulp bump --ver major
```

which will do a major version bump instead of the default `patch`. 


### `dest` 

used exclusively with the `copy` command to alter were a zip file for a mod is copied to.

```
C:/mods/FS25_TestMod $> gulp build --dest ../testingForFun/
```

which will instead of copying to the default `C:/mods/testing/ModHub/` folder, will copy to `C:/mods/testingForFun/` folder. the destination is relative to where the command was run.






