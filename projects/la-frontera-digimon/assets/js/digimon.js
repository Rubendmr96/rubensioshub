const CHANNEL_ID = "UCqc-fmnWOInmLb6D8aM1uHA";
const RSS_URL = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`);
const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${RSS_URL}`;
const container = document.getElementById("videos");

async function cargarVideos() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        container.innerHTML = '';
        if (!data.items?.length) {
            container.innerHTML = '<div class="placeholder">NO SE ENCONTRARON VÍDEOS.</div>';
            return;
        }
        data.items.slice(0, 3).forEach(video => {
            const card = document.createElement('article');
            card.className = 'video-card';
            card.innerHTML = `
            <div class="thumbnail-container">
              <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
              <div class="play-icon"></div>
            </div>
            <div class="video-content">
              <h3>${video.title.toUpperCase()}</h3>
              <div class="date">${new Date(video.pubDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</div>
              <div class="video-actions">
                <a class="button" href="${video.link}" target="_blank" rel="noopener noreferrer">VER EN YOUTUBE</a>
              </div>
            </div>`;
            card.querySelector('.thumbnail-container').onclick = () => window.open(video.link, '_blank', 'noopener');
            container.appendChild(card);
        });
    } catch (err) {
        container.innerHTML = '<div class="placeholder">ERROR AL CARGAR LOS VÍDEOS.</div>';
    } finally {
        container.setAttribute('aria-busy', 'false');
    }
}

cargarVideos();