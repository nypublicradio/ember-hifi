import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import { skip } from 'qunit';
import sinon from 'sinon';
// import HowlerFactory from 'audio-pledge/audio-pledge-factories/howler';
// import { Howl } from 'howler';

let sandbox;
const goodUrl = "http://example.org/good.aac";
const badUrl  = "/there-aint-nothing-here.aac";

moduleFor('audio-pledge@audio-pledge-factory:howler', 'Unit | Factory | Howler', {
  needs:['service:debug-logger',
         'audio-pledge@audio-pledge-factory:base'],
  beforeEach() {
    sandbox = sinon.sandbox.create({
      useFakeServer: sinon.fakeServerWithClock
    });
    sandbox.server.respondImmediately = true;
    sandbox.server.respondWith(goodUrl, function (xhr) {
      xhr.respond(200, {}, []);
    });

    sandbox.server.respondWith(badUrl, function (xhr) {
      xhr.respond(404, {}, []);
    });
  },
  afterEach() {
    sandbox.restore();
  }
});

// TODO make this work
skip("If we 404, we give up", function(assert) {
  let done = assert.async();
  let sound           = this.subject({url: badUrl});
  let loadErrorFired = false;

  sound.on('audio-load-error', function() {
    loadErrorFired = true;
    done();
  });

  assert.ok(loadErrorFired, "should have triggered audio load error");
});
