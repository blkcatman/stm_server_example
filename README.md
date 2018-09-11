# StreamingMesh Server Example

Server example for StreamingMesh: https://github.com/blkcatman/StreamingMesh


## REQUIREMENTS TO USE

Before you need install node from https://nodejs.org/ , or using generic package managers.


## HOW TO USE

### Add FFmpeg Excutable File

* Add `ffmpeg` excutable file or create symbolic link in `/bin` directory.


### Setup Server

1. Install node module dependencies.
```
npm install
```

2. Input below code in terminal window and press `Enter`.
```
npm run start
```

3. If you want quit the server, press `Ctrl+C` .


### Clean public folder

This server does not delete any files, which is uploaded from clients and save in a `public` folder.
If you want re-send same data from clients, Delete files before sending. 