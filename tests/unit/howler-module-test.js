import { module, test } from 'qunit';
import Howl, {Howler} from 'howler';

module('howler as an ES6 module');

  test('it works', function(assert) {
    assert.ok(Howl, "howl exists");
    assert.ok(Howler, "howler exists");
  });
