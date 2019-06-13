# Introduction

`ember-hifi` provides an easy way to manage audio in your ember app with reliable states, useful events, direct controls and a nice API to interact directly with playing and paused sounds.


## High level overview

The `hifi` service manages loading and playing sounds, making sure that only one sound plays at at time, setting volume, and providing system-level events. You'll mostly interact with this service.

Hifi `connections` are factory classes that plug into hifi and know how to load particular sound types. Hifi includes three default connections:
  - a `native-audio` connection that uses the native `audio` element. This is prioritized automatically on mobile devices.
  - a `howler` connection that uses howler.js
  - an `hls` connection to play .hls streams.

Different devices have different audio capabilities, so given a url the `hifi` service will try each loaded connection until one succeeds by returning a `sound` object.
