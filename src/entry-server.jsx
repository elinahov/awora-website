// Server entry used only at build time (scripts/prerender.mjs) to render public pages to HTML,
// so search engines and AI assistants get real content without running JavaScript.
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App.jsx';
import { CatalogProvider } from './lib/catalog.jsx';
import { CartProvider } from './cart.jsx';
import { AuthProvider } from './lib/auth.jsx';
import ProductPreview from './components/ProductPreview.jsx';
import { initialConfig } from './lib/config.js';

export function render(url, catalog) {
  return renderToString(
    <StaticRouter location={url}>
      <AuthProvider>
        <CatalogProvider initial={catalog}>
          <CartProvider>
            <App />
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </StaticRouter>
  );
}

// A product's default design as a standalone SVG (used as its image in structured data).
export function productSvg(product, catalog) {
  const html = renderToString(
    <CatalogProvider initial={catalog}>
      <ProductPreview config={initialConfig(product, catalog.combos)} title={product.name?.en} />
    </CatalogProvider>
  );
  return html.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
}

export { seoFor, indexablePaths, headHtml } from './lib/seo.js';
export * as seed from './data/seed.js';
export { mergePricing } from './lib/config.js';
