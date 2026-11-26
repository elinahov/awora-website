// Cloudflare Pages Function for /api/order (used only if the site is deployed as a Pages project;
// the Worker deploy uses worker/index.js). Both share api/_cf.js.
import { handleOrder } from '../../api/_cf.js';

export const onRequest = ({ request, env }) => handleOrder(request, env);
