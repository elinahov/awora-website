import { useCatalog } from '../../lib/catalog.jsx';
import RowsEditor from './RowsEditor.jsx';

export default function Palette() {
  const { colors } = useCatalog();
  const colorOpts = colors.map(c => ({ value: c.id, label: c.name.en }));
  return (
    <>
      <RowsEditor table="colors" title="Colors" hint="Every color customers can pick. A color used by a combo can't be deleted until the combo changes."
        blank={{ id: '', hex: '#FFF9EF', name: { en: '', hy: '' } }}
        columns={[
          { key: 'hex', label: 'Color', type: 'color' },
          { key: 'name.en', label: 'Name (EN)' },
          { key: 'name.hy', label: 'Name (HY)' },
          { key: 'sort', label: 'Order', type: 'number' }
        ]} />
      <RowsEditor table="combos" title="Color combos" hint="Ready-made base / pattern / accent sets shown in the configurator and on the homepage."
        blank={{ id: '', name: { en: '', hy: '' }, base: colors[0]?.id, pattern: colors[1]?.id, accent: colors[0]?.id }}
        columns={[
          { key: 'name.en', label: 'Name (EN)' },
          { key: 'name.hy', label: 'Name (HY)' },
          { key: 'base', label: 'Base', type: 'select', options: colorOpts },
          { key: 'pattern', label: 'Pattern', type: 'select', options: colorOpts },
          { key: 'accent', label: 'Accent', type: 'select', options: colorOpts },
          { key: 'sort', label: 'Order', type: 'number' }
        ]} />
    </>
  );
}
