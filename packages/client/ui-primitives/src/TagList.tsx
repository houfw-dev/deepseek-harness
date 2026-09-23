// TagList: a single-line, clipped row of tag pills for table cells. Pills that
// overflow the owning cell's width are hidden instead of wrapping, and hovering
// or focusing the row shows a tooltip listing every tag. The tooltip is
// position:fixed (see Tooltip), so it escapes the table's horizontal scroll
// clip. Zero cordis: the join punctuation is a fixed Chinese comma, matching
// the other atoms whose copy defaults to Chinese literals.

import { Tooltip } from './Tooltip.tsx'
import css from './TagList.module.css'

/**
 * Render tags as one clipped pill row with the full list in a hover tooltip.
 * @param props.tags - the tag strings; an empty list renders nothing.
 * @returns the clipped pill row wrapped in a tooltip, or null when empty.
 */
export function TagList({ tags }: { tags: readonly string[] }) {
  if (tags.length === 0) return null
  return (
    <Tooltip side="bottom" label={tags.join('，')}>
      <span className={css.tagList}>
        {tags.map(tag => <span key={tag} className={css.tagPill}>{tag}</span>)}
      </span>
    </Tooltip>
  )
}
