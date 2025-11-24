// client/src/pages/NewsPage.jsx
import { useEffect, useState } from 'react';
import { getSustainabilityNews } from '../utils/api.js';
import './NewsPage.css';

const NewsCard = ({ article }) => {
  const img = article.fields?.thumbnail;
  const trail = article.fields?.trailText || '';
  const byline = article.fields?.byline || '';
  const date = article.publishedAt ? new Date(article.publishedAt).toLocaleString() : '';

  return (
    <a className="news-card" href={article.webUrl} target="_blank" rel="noreferrer">
      {img ? <img className="news-img" src={img} alt={article.webTitle} /> : <div className="news-img placeholder">No Image</div>}
      <div className="news-body">
        <h3 className="news-title">{article.webTitle}</h3>
        {trail && <p className="news-trail" dangerouslySetInnerHTML={{ __html: trail }} />}
        <div className="news-meta">
          <span className="news-chip">{article.sectionName || 'Environment'}</span>
          {byline && <span className="news-byline">• {byline}</span>}
        </div>
        <div className="news-date">{date}</div>
      </div>
    </a>
  );
};

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const items = await getSustainabilityNews();
        setNews(items);
      } catch (e) {
        setErr(e.message || 'Failed to load news');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="news-page">
        <div className="news-header">
          <h1>🌍 Sustainability News</h1>
          <p>Latest on climate, pollution, impact, and breakthroughs</p>
        </div>
        <div className="news-loading">
          <div className="spinner" />
          <p>Fetching fresh stories…</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="news-page">
        <div className="news-header">
          <h1>🌍 Sustainability News</h1>
        </div>
        <div className="news-error">
          <p>Unable to load news.</p>
          <code>{err}</code>
        </div>
      </div>
    );
  }

  return (
    <div className="news-page">
      <div className="news-header">
        <h1>🌍 Sustainability News</h1>
        <p>Latest on climate, pollution, impact, and breakthroughs</p>
      </div>

      {news.length === 0 ? (
        <div className="news-empty">
          <p>No stories found right now. Try again shortly.</p>
        </div>
      ) : (
        <div className="news-grid">
          {news.map(item => (
            <NewsCard key={item.id} article={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsPage;
