// Runs in the page's own JS world so it can call YouTube's player API.
// Reports the current video's caption tracks to the content script via postMessage.
(() => {
  function report() {
    try {
      const player = document.getElementById('movie_player');
      const resp = player && player.getPlayerResponse && player.getPlayerResponse();
      const tracks =
        (resp &&
          resp.captions &&
          resp.captions.playerCaptionsTracklistRenderer &&
          resp.captions.playerCaptionsTracklistRenderer.captionTracks) ||
        [];
      window.postMessage(
        {
          source: 'finglish-bridge',
          videoId: (resp && resp.videoDetails && resp.videoDetails.videoId) || null,
          tracks: tracks.map((t) => ({
            baseUrl: t.baseUrl,
            languageCode: t.languageCode,
            kind: t.kind || '',
          })),
        },
        '*'
      );
    } catch (e) {
      /* player not ready */
    }
  }

  window.addEventListener('message', (e) => {
    if (e.source === window && e.data && e.data.source === 'finglish-content') report();
  });
  window.addEventListener('yt-navigate-finish', () => setTimeout(report, 400));
})();
