Fork Bot
========

[![Greenkeeper badge](https://badges.greenkeeper.io/elliotttf/fork-bot.svg)](https://greenkeeper.io/)

Fork bot watches an upstream fork for new tags and opens pull requests
with those tags against your fork!

## Getting started

Copy the ```config/example.config.json``` file to ```config/config.json```
and update the settings for your repositories.

Start the application by running:

```
node fork-bot.js watch
```

Sit back and ignore your fork until the next upstream release is tagged!
