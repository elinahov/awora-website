import { useCatalog } from '../../lib/catalog.jsx';
import RowsEditor from './RowsEditor.jsx';

export default function Collections() {
  const { colors } = useCatalog();
  const colorOpts = [{ value: '', label: '—' }, ...colors.map(c => ({ value: c.id, label: c.name.en }))];
  return (
    <RowsEditor table="collections" title="Collections" hint="Collections group products in the catalog filter."
      blank={{ id: '', name: { en: '', hy: '' }, color: null }}
      columns={[
        { key: 'name.en', label: 'Name (EN)' },
        { key: 'name.hy', label: 'Name (HY)' },
        { key: 'color', label: 'Color', type: 'select', options: colorOpts },
        { key: 'sort', label: 'Order', type: 'number' }
      ]} />
  );
}
