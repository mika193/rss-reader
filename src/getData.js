export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  if (!doc.querySelector('rss')) {
    throw new Error('parsing mistake');
  }
  const title = doc.querySelector('title').textContent;
  const description = doc.querySelector('description').textContent;
  const items = [...doc.querySelectorAll('item')];

  const chanel = {
    title,
    description,
  };

  const articles = items.map((article) => {
    const name = article.querySelector('title').textContent;
    const href = article.querySelector('link').textContent;
    const text = article.querySelector('description').textContent;
    return { name, href, text };
  });

  return { chanel, articles };
};
