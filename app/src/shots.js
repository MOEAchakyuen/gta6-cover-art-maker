// Deterministic screenshot scenes, driven by ?shot=:
//   cover   — exported wide cover alone (pier, "Sunset Heist")
//   editor  — the editor with the boulevard sample loaded, 2 panels
//   cover2  — exported portrait cover alone (boulevard, "Boulevard Queen")
//   editor2 — the editor in the 3-panel comic strip layout
// Each scene loads its sample and sets its caption itself, so a screenshot
// taken twice shows the same picture. window.__shotReady fires once painted.

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (!shot) {
  // No scene requested; nothing to do.
} else {
  const app = window.__app;
  const waitReady = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
  };
  const coverScene = async (sample, layout, sizeKey, caption, sub) => {
    document.body.classList.add('shot-cover');
    app.setSize(sizeKey);
    await app.loadSampleIntoPanels(sample, layout, caption, sub);
    waitReady();
  };
  const editorScene = async (sample, layout, caption, sub) => {
    await app.loadSampleIntoPanels(sample, layout, caption, sub);
    waitReady();
  };
  if (shot === 'cover') {
    coverScene('pier', 'duo', 'wide', 'Sunset Heist', 'Vice nights · one last job').catch(() => { window.__shotReady = true; });
  } else if (shot === 'cover2') {
    coverScene('boulevard', 'solo', 'portrait', 'Boulevard Queen', 'Neon boulevard · after dark').catch(() => { window.__shotReady = true; });
  } else if (shot === 'editor') {
    editorScene('boulevard', 'duo', 'Boulevard Queen', 'Neon boulevard · after dark').catch(() => { window.__shotReady = true; });
  } else if (shot === 'editor2') {
    editorScene('pier', 'trio', 'Sunset Heist', 'Vice nights · one last job').catch(() => { window.__shotReady = true; });
  } else {
    waitReady();
  }
}
