var circleFolder = process.env.CIRCLE_TEST_REPORTS;

module.exports = {
  test_page: 'tests/index.html?hidepassed',
  disable_watching: true,
  launch_in_ci: [
    'Chrome'
  ],
  launch_in_dev: [
  ],
  browser_args: {
    Chrome: [
      // --no-sandbox is needed when running Chrome inside a container
      process.env.TRAVIS ? '--no-sandbox' : null,

      '--disable-gpu',
      '--headless',
      '--remote-debugging-port=0',
      '--window-size=1440,900',
      '--ignore-autoplay-restriction',
      '--no-user-gesture-required',
      '--debug',
    ].filter(Boolean),
  },
  reporter: circleFolder ? 'xunit' : 'tap',
  report_file: circleFolder ? cricleFolder + '/test.xml' : '',
  xunit_intermediate_output: true
};
