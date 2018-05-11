import Controller from '@ember/controller';

// BEGIN-SNIPPET basic-audio
const wnyc = {
  name: 'WNYC',
  url: 'https://fm939.wnyc.org/wnycfm.aac',
};

const wqxr = {
  name: 'WQXR',
  url: 'https://stream.wqxr.org/wqxr.aac'
};

const q2 = {
  name: 'Q2',
  url: 'https://q2stream.wqxr.org/q2-web.aac'
};

const story = {
  title: '"We\'ll Do It Live!"',
  show: 'On The Media',
  url: 'https://www.podtrac.com/pts/redirect.mp3/audio.wnyc.org/otm/otm04212017pod.mp3'
};
// END-SNIPPET

// BEGIN-SNIPPET audio-no-extension
const streamWithoutExtension = {
  name: 'wqxr',
  url: 'https://stream.wqxr.org/wqxr'
};
// END-SNIPPET

// BEGIN-SNIPPET more-stories
const moreStories = [{
  title: 'Marching for Science, Terror and Politics in Paris, Mozart in Cuba',
  url: 'https://www.podtrac.com/pts/redirect.mp3/audio.wnyc.org/ttp/ttp042117.mp3',
  show: 'The Takeaway'
}, {
  title: 'Earth 2.0: Is Income Inequality Inevitable?',
  url: 'https://www.podtrac.com/pts/redirect.mp3/audio.wnyc.org/freakonomics_podcast/freakonomics_podcast041917.mp3',
  show: 'Freakonomics Radio'
}];
// END-SNIPPET


export default Controller.extend({
  wnyc,
  wqxr,
  q2,
  story,
  streamWithoutExtension,
  moreStories,
});
