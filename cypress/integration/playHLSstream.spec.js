/// <reference types="cypress" />

context('Load and Play HLS Stream', () => {
    beforeEach(() => {
      cy.visit('https://nypublicradio.github.io/ember-hifi/#/diagnostic')
      });
  });
 
  it('play WQXR', function() {
   

    cy.visit('https://nypublicradio.github.io/ember-hifi/#/diagnostic')

    // we need better locators than the ember numbering but this works for POC here

    // Load 93.9 FM stream
    cy.get('#ember46.input.ember-text-field.ember-view').click().type('https://kut-hls.streamguys1.com/kut2/playlist.m3u8')
    cy.get('#ember47.input.ember-text-field.ember-view').click().type('HLS Stream');
    cy.contains('button.is-medium.is-outline.is-dark', 'Load').click()

    // Open Debug Panel and Verify Load Request
    cy.get('.diagnostic-debug-toggle').click()
    cy.contains('pre-load');
    cy.contains('new-load-request');
    
    // Play 93.9 FM stream and Verify it loads and plays
    cy.contains('button.is-medium.is-info', 'Play').click()
    cy.contains('audio-played');
    cy.contains('audio-loading');

    // Pause Audio and Verify Paused
    cy.get('.svg-inline--fa.fa-pause.fa-w-14.fa-2x.undefined.ember-view').click()
    cy.contains('audio-paused');

    // Play Again and Rewind - Verify both actions
    cy.get('.svg-inline--fa.fa-play.fa-w-14.fa-2x.undefined.ember-view').click({ multiple: true})
    cy.contains('audio-played');
    cy.contains('audio-loading');
    cy.get('.svg-inline--fa.fa-backward.fa-w-16.fa-2x.undefined.ember-view').click()
    cy.contains('audio-will-rewind');

    // Fast-Forward Stream and Verify
    cy.get('.svg-inline--fa.fa-forward.fa-w-16.fa-2x.undefined.ember-view').click()
    cy.contains('audio-will-fast-forward');

    // Stop Stream and Verify
    cy.wait(3000)
    cy.get('.svg-inline--fa.fa-stop.fa-w-14.fa-2x.undefined.ember-view').click()
    cy.contains('audio-paused');

    // Verify Audio Stopped and Played Again
    cy.wait(3000)
    cy.get('.svg-inline--fa.fa-play.fa-w-14.fa-2x.undefined.ember-view').click({ multiple: true})
    cy.contains('audio-loading');
    cy.contains('audio-played');

   // Ignore uncaught exceptions in Cypress
    Cypress.on('uncaught:exception', (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false
  })
    
  })